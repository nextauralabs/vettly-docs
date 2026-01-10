using System;

namespace Vettly
{
    public enum Decision
    {
        Allow,
        Block,
        Review
    }

    [Serializable]
    public class TextModerationRequest
    {
        public string userId;
        public string content;
        public string policy;
        public string context;
        public string locale;

        public TextModerationRequest(string userId, string content, string policy = null, string context = "", string locale = "en")
        {
            this.userId = userId;
            this.content = content;
            this.policy = policy;
            this.context = context;
            this.locale = locale;
        }
    }

    [Serializable]
    public class TextModerationResponse
    {
        public string decision;
        public string reason;
        public float confidence;
        public string explanation;
        public string requestId;
    }

    public class VettlyResult
    {
        public Decision Decision { get; }
        public string Reason { get; }
        public float Confidence { get; }
        public string Explanation { get; }
        public string RequestId { get; }
        public bool FromFallback { get; }

        public bool IsAllowed => Decision == Decision.Allow;
        public bool IsBlocked => Decision == Decision.Block;
        public bool NeedsReview => Decision == Decision.Review;

        public VettlyResult(Decision decision, string reason, float confidence, string explanation, string requestId, bool fromFallback = false)
        {
            Decision = decision;
            Reason = reason ?? "";
            Confidence = confidence;
            Explanation = explanation ?? "";
            RequestId = requestId ?? "";
            FromFallback = fromFallback;
        }

        public static VettlyResult CreateFallback(bool failOpen, string reason = "API call failed")
        {
            var decision = failOpen ? Decision.Allow : Decision.Block;
            return new VettlyResult(decision, reason, 0f, "Fallback due to API failure", "", true);
        }

        public static VettlyResult FromResponse(TextModerationResponse response)
        {
            if (response == null)
            {
                return CreateFallback(true, "Invalid response");
            }

            if (!Enum.TryParse<Decision>(response.decision, true, out var decision))
            {
                decision = Decision.Block;
            }

            return new VettlyResult(decision, response.reason, response.confidence, response.explanation, response.requestId, false);
        }
    }
}