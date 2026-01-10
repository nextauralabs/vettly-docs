# Unity SDK

Integrate Vettly content moderation into Unity games using the Unity SDK.

## Install

### Option A: Unity Package Manager (Git URL)

Add the package in **Window → Package Manager → + → Add package from git URL**.

Use this repository and the `?path=` parameter:

```
https://github.com/brian-nextaura/vettly-docs.git?path=/unity-sdk/com.vettly.unity
```

### Option B: Copy the package folder

Copy `unity-sdk/com.vettly.unity` into your Unity project as a local package.

## Configure

Create a `VettlySettings` asset (or configure via the provided editor UI, if present in your version) and set:

- `ApiKey` (starts with `vettly_...`)
- `ApiUrl` (default: `https://api.vettly.dev`)

::: warning
Never commit API keys into source control. Use environment variables or build-time secrets.
:::

## Quick Start (Text Moderation)

```csharp
using System.Threading;
using System.Threading.Tasks;

public class Example
{
    public static async Task CheckTextAsync(VettlyClient client, CancellationToken ct)
    {
        var result = await client.TextModeration.CheckAsync(
            content: "Hello world",
            policyId: "balanced",
            ct: ct
        );

        if (result.Safe)
        {
            // Allowed
        }
        else
        {
            // Handle blocked/warned content
        }
    }
}
```

## What’s Included

- `unity-sdk/com.vettly.unity/Runtime` — runtime client + models
- `unity-sdk/com.vettly.unity/Editor` — editor tooling
- `unity-sdk/Assets/Vettly` — Asset Store-style layout (optional)

## Notes

- The SDK uses `UnityWebRequest` for HTTP.
- For IL2CPP builds, keep AOT/serialization considerations in mind if you extend models.
