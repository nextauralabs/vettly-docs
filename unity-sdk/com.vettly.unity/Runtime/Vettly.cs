using System;
using System.Threading.Tasks;
using UnityEngine;

namespace Vettly
{
    public static class Vettly
    {
        private static VettlyClient client;
        private static VettlyTextModeration textModeration;
        private static bool isInitialized = false;

        public static Task Initialize(VettlySettings settings)
        {
            if (settings == null)
            {
                throw new ArgumentNullException(nameof(settings));
            }

            if (string.IsNullOrEmpty(settings.ApiKey))
            {
                throw new ArgumentException("API key is required", nameof(settings));
            }

            try
            {
                client = new VettlyClient(settings);
                textModeration = new VettlyTextModeration(client);
                isInitialized = true;
                
                Debug.Log("Vettly SDK initialized successfully");
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to initialize Vettly SDK: {ex.Message}");
                throw;
            }
        }

        public static async Task InitializeFromResources()
        {
            var settings = Resources.Load<VettlySettings>("VettlySettings");
            
            if (settings == null)
            {
                throw new InvalidOperationException("VettlySettings not found in Resources folder. Create a VettlySettings asset and place it in a Resources folder.");
            }

            await Initialize(settings);
        }

        public static async Task<VettlyResult> ModerateTextAsync(string userId, string content, string locale = "en", string context = "", string policy = null)
        {
            if (!isInitialized)
            {
                throw new InvalidOperationException("Vettly SDK not initialized. Call Initialize() or InitializeFromResources() first.");
            }

            if (textModeration == null)
            {
                return VettlyResult.CreateFallback(false, "Text moderation service not available");
            }

            return await textModeration.ModerateTextAsync(userId, content, locale, context, policy);
        }

        public static bool IsInitialized => isInitialized;
    }
}