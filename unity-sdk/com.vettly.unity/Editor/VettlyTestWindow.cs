using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEditor;

namespace Vettly.Editor
{
    public class VettlyTestWindow : EditorWindow
    {
        private VettlySettings settings;
        private string userId = "test-user-123";
        private string locale = "en";
        private string context = "";
        private string policyOverride = "";
        private string textContent = "Hello world! This is a test message.";
        private VettlyResult lastResult;
        private bool isTestRunning = false;
        private Vector2 scrollPosition;

        [MenuItem("Tools/Vettly/Test Window")]
        public static void ShowWindow()
        {
            var window = GetWindow<VettlyTestWindow>("Vettly Test");
            window.minSize = new Vector2(400, 600);
            window.Show();
        }

        private void OnEnable()
        {
            titleContent = new GUIContent("Vettly Test");
        }

        private void OnGUI()
        {
            scrollPosition = EditorGUILayout.BeginScrollView(scrollPosition);

            EditorGUILayout.LabelField("Vettly Test Window", EditorStyles.boldLabel);
            EditorGUILayout.Space();

            DrawSettingsSection();
            EditorGUILayout.Space();

            DrawTestInputSection();
            EditorGUILayout.Space();

            DrawTestButton();
            EditorGUILayout.Space();

            DrawResultsSection();

            EditorGUILayout.EndScrollView();
        }

        private void DrawSettingsSection()
        {
            EditorGUILayout.LabelField("Settings", EditorStyles.boldLabel);
            
            var newSettings = EditorGUILayout.ObjectField("Settings Asset", settings, typeof(VettlySettings), false) as VettlySettings;
            
            if (newSettings != settings)
            {
                settings = newSettings;
                lastResult = null;
            }

            if (settings != null)
            {
                EditorGUI.indentLevel++;
                EditorGUILayout.LabelField($"Environment: {settings.Environment}");
                EditorGUILayout.LabelField($"Base URL: {settings.ResolveBaseUrl()}");
                EditorGUILayout.LabelField($"Fail Open: {settings.FailOpen}");
                EditorGUI.indentLevel--;
            }
            else
            {
                EditorGUILayout.HelpBox("Select a VettlySettings asset to begin testing.", MessageType.Info);
            }
        }

        private void DrawTestInputSection()
        {
            EditorGUILayout.LabelField("Test Input", EditorStyles.boldLabel);
            
            EditorGUI.BeginDisabledGroup(settings == null || isTestRunning);

            userId = EditorGUILayout.TextField("User ID", userId);
            locale = EditorGUILayout.TextField("Locale", locale);
            context = EditorGUILayout.TextField("Context", context);
            policyOverride = EditorGUILayout.TextField("Policy Override", policyOverride);
            textContent = EditorGUILayout.TextArea(textContent, GUILayout.Height(100));

            EditorGUI.EndDisabledGroup();
        }

        private void DrawTestButton()
        {
            EditorGUI.BeginDisabledGroup(settings == null || isTestRunning || string.IsNullOrEmpty(textContent));
            
            if (GUILayout.Button(isTestRunning ? "Testing..." : "Test Moderation", GUILayout.Height(30)))
            {
                RunTest();
            }
            
            EditorGUI.EndDisabledGroup();
        }

        private void DrawResultsSection()
        {
            EditorGUILayout.LabelField("Results", EditorStyles.boldLabel);

            if (lastResult == null)
            {
                EditorGUILayout.HelpBox("Run a test to see results here.", MessageType.Info);
                return;
            }

            EditorGUILayout.BeginVertical("box");
            
            EditorGUILayout.LabelField($"Decision: {lastResult.Decision}", 
                lastResult.Decision switch
                {
                    Decision.Allow => new GUIStyle(EditorStyles.label) { normal = { textColor = Color.green } },
                    Decision.Block => new GUIStyle(EditorStyles.label) { normal = { textColor = Color.red } },
                    Decision.Review => new GUIStyle(EditorStyles.label) { normal = { textColor = Color.yellow } },
                    _ => EditorStyles.label
                });

            EditorGUILayout.LabelField($"Reason: {lastResult.Reason}");
            EditorGUILayout.LabelField($"Confidence: {lastResult.Confidence:F2}");
            EditorGUILayout.LabelField($"Explanation: {lastResult.Explanation}");
            EditorGUILayout.LabelField($"Request ID: {lastResult.RequestId}");
            EditorGUILayout.LabelField($"From Fallback: {lastResult.FromFallback}");

            EditorGUILayout.Space();

            EditorGUILayout.BeginHorizontal();
            EditorGUILayout.LabelField("Convenience Properties:", EditorStyles.boldLabel);
            EditorGUILayout.LabelField($"IsAllowed: {lastResult.IsAllowed}", 
                lastResult.IsAllowed ? new GUIStyle(EditorStyles.label) { normal = { textColor = Color.green } } : EditorStyles.label);
            EditorGUILayout.LabelField($"IsBlocked: {lastResult.IsBlocked}", 
                lastResult.IsBlocked ? new GUIStyle(EditorStyles.label) { normal = { textColor = Color.red } } : EditorStyles.label);
            EditorGUILayout.LabelField($"NeedsReview: {lastResult.NeedsReview}", 
                lastResult.NeedsReview ? new GUIStyle(EditorStyles.label) { normal = { textColor = Color.yellow } } : EditorStyles.label);
            EditorGUILayout.EndHorizontal();

            EditorGUILayout.EndVertical();
        }

        private async void RunTest()
        {
            if (settings == null || string.IsNullOrEmpty(textContent))
            {
                return;
            }

            isTestRunning = true;
            lastResult = null;

            try
            {
                await Vettly.Initialize(settings);
                
                var policy = string.IsNullOrEmpty(policyOverride) ? null : policyOverride;
                lastResult = await Vettly.ModerateTextAsync(userId, textContent, locale, context, policy);
            }
            catch (Exception ex)
            {
                lastResult = VettlyResult.CreateFallback(settings.FailOpen, $"Test failed: {ex.Message}");
                Debug.LogError($"Vettly test error: {ex.Message}");
            }
            finally
            {
                isTestRunning = false;
                Repaint();
            }
        }
    }
}