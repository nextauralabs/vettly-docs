# Vettly Unity SDK

Trust and safety SDK for Unity games with comprehensive text moderation and editor tooling.

## Installation

1. Open Unity Package Manager (`Window > Package Manager`)
2. Click the `+` icon and select "Add package from git URL"
3. Enter: `https://github.com/vettly/com.vettly.unity.git`

## Quick Start

1. Create Settings: `Assets > Create > Vettly > Settings`
2. Configure your API key and environment
3. Initialize the SDK:

```csharp
using Vettly;

// Initialize with settings asset
var settings = Resources.Load<VettlySettings>("VettlySettings");
await Vettly.Initialize(settings);

// Or initialize from Resources (expects VettlySettings.asset in Resources folder)
await Vettly.InitializeFromResources();
```

4. Use text moderation:

```csharp
var result = await Vettly.ModerateTextAsync("player123", "Hello world!");

if (result.IsAllowed)
{
    // Content is safe
    Debug.Log($"Allowed: {result.Explanation}");
}
else if (result.IsBlocked)
{
    // Content is blocked
    Debug.LogWarning($"Blocked: {result.Reason}");
}
else if (result.NeedsReview)
{
    // Content needs manual review
    Debug.LogWarning($"Review needed: {result.Reason}");
}
```

## Configuration

### VettlySettings Properties

- **API Key**: Your Vettly API key (warning: do not ship long-lived keys in production)
- **Environment**: Production or Sandbox
- **Base URL Override**: Optional custom API endpoint
- **Fail Open**: If true, allow content when API fails; if false, block content
- **Timeout Seconds**: Request timeout in seconds
- **Policy Preset**: Policy preset name to use

### Security Note

For production builds, avoid embedding long-lived API keys. Use temporary keys or fetch them from a secure backend service.

## Editor Tools

### Test Window

Access via `Tools > Vettly > Test Window` to test moderation directly in the editor.

- Select your VettlySettings asset
- Enter test content and parameters
- Click "Test Moderation" to see results

## API Reference

### VettlyResult

```csharp
public class VettlyResult
{
    public Decision Decision { get; }    // Allow, Block, Review
    public string Reason { get; }         // Moderation reason
    public float Confidence { get; }      // 0-1 confidence score
    public string Explanation { get; }    // Human-readable explanation
    public string RequestId { get; }      // Request identifier
    public bool FromFallback { get; }     // True if result is from fallback
    
    public bool IsAllowed { get; }        // Convenience: Decision == Allow
    public bool IsBlocked { get; }        // Convenience: Decision == Block
    public bool NeedsReview { get; }      // Convenience: Decision == Review
}
```

### Methods

```csharp
// Initialize with settings
Task Initialize(VettlySettings settings)

// Initialize from Resources/VettlySettings.asset
Task InitializeFromResources()

// Moderate text content
Task<VettlyResult> ModerateTextAsync(string userId, string content, 
    string locale = "en", string context = "", string policy = null)
```

## Requirements

- Unity 2021.3 LTS or higher
- .NET Standard 2.1 compatibility
- Internet connection for API calls

## Support

For support and documentation, visit [https://docs.vettly.com](https://docs.vettly.com)

## License

See the LICENSE file for licensing information.