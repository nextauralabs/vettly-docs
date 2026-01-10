using System;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace Vettly
{
    public class VettlyClient
    {
        private readonly VettlySettings settings;
        private readonly string baseUrl;

        public VettlyClient(VettlySettings settings)
        {
            this.settings = settings ?? throw new ArgumentNullException(nameof(settings));
            this.baseUrl = settings.ResolveBaseUrl();
        }

        public async Task<VettlyResult> ModerateTextAsync(string userId, string content, string locale = "en", string context = "", string policy = null)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
                }

                if (string.IsNullOrEmpty(content))
                {
                    throw new ArgumentException("Content cannot be null or empty", nameof(content));
                }

                var requestPayload = new TextModerationRequest(userId, content, policy, context, locale);
                var jsonPayload = JsonUtility.ToJson(requestPayload);
                
                var endpoint = $"{baseUrl}/v1/moderate/text";
                var request = new UnityWebRequest(endpoint, "POST");
                
                byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", $"Bearer {settings.ApiKey}");
                request.SetRequestHeader("User-Agent", "Vettly-Unity/1.0.0");
                
                request.timeout = settings.TimeoutSeconds;

                var webRequest = await request.SendWebRequestAsync();

                if (!webRequest.IsSuccess())
                {
                    Debug.LogError($"Vettly API error: {webRequest.GetErrorMessage()}");
                    return VettlyResult.CreateFallback(settings.FailOpen, webRequest.GetErrorMessage());
                }

                var jsonResponse = webRequest.downloadHandler.text;
                var response = JsonUtility.FromJson<TextModerationResponse>(jsonResponse);
                
                return VettlyResult.FromResponse(response);
            }
            catch (Exception ex)
            {
                Debug.LogError($"Vettly client error: {ex.Message}");
                return VettlyResult.CreateFallback(settings.FailOpen, ex.Message);
            }
        }
    }
}