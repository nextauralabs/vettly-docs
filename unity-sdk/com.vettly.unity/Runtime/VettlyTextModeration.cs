using System;
using System.Threading.Tasks;

namespace Vettly
{
    public class VettlyTextModeration
    {
        private readonly VettlyClient client;

        public VettlyTextModeration(VettlyClient client)
        {
            this.client = client ?? throw new ArgumentNullException(nameof(client));
        }

        public async Task<VettlyResult> ModerateTextAsync(string userId, string content, string locale = "en", string context = "", string policy = null)
        {
            try
            {
                if (client == null)
                {
                    return VettlyResult.CreateFallback(true, "Client not initialized");
                }

                return await client.ModerateTextAsync(userId, content, locale, context, policy);
            }
            catch (Exception ex)
            {
                Debug.LogError($"Text moderation error: {ex.Message}");
                return VettlyResult.CreateFallback(true, ex.Message);
            }
        }
    }
}