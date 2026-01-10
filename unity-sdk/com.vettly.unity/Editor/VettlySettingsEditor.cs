using UnityEngine;
using UnityEditor;

namespace Vettly.Editor
{
    [CustomEditor(typeof(VettlySettings))]
    public class VettlySettingsEditor : UnityEditor.Editor
    {
        private const string ApiKeyWarning = "⚠️ Security Warning: Do not ship long-lived API keys in production builds. Consider using temporary keys or fetching keys from a secure backend service.";

        public override void OnInspectorGUI()
        {
            serializedObject.Update();

            EditorGUI.BeginChangeCheck();

            EditorGUILayout.HelpBox(ApiKeyWarning, MessageType.Warning);

            EditorGUILayout.PropertyField(serializedObject.FindProperty("apiKey"), new GUIContent("API Key", "Your Vettly API key"));
            
            EditorGUILayout.PropertyField(serializedObject.FindProperty("environment"), new GUIContent("Environment", "Target environment"));
            
            EditorGUILayout.PropertyField(serializedObject.FindProperty("baseUrlOverride"), new GUIContent("Base URL Override", "Optional custom API endpoint (leave empty to use default)"));
            
            EditorGUILayout.Space();
            EditorGUILayout.LabelField("Behavior", EditorStyles.boldLabel);
            
            EditorGUILayout.PropertyField(serializedObject.FindProperty("failOpen"), new GUIContent("Fail Open", "If true, allow content when API fails; if false, block content"));
            
            EditorGUILayout.PropertyField(serializedObject.FindProperty("timeoutSeconds"), new GUIContent("Timeout Seconds", "Request timeout in seconds"));
            
            EditorGUILayout.PropertyField(serializedObject.FindProperty("policyPreset"), new GUIContent("Policy Preset", "Policy preset name to use"));

            if (EditorGUI.EndChangeCheck())
            {
                serializedObject.ApplyModifiedProperties();
            }

            EditorGUILayout.Space();

            if (GUILayout.Button("Open Test Window"))
            {
                VettlyTestWindow.ShowWindow();
            }

            EditorGUILayout.HelpBox($"Resolved Base URL: {(target as VettlySettings).ResolveBaseUrl()}", MessageType.Info);
        }
    }
}