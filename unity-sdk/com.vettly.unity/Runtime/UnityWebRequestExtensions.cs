using System;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.Networking;

namespace Vettly
{
    public static class UnityWebRequestExtensions
    {
        public static Task<UnityWebRequest> SendWebRequestAsync(this UnityWebRequest request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request));
            }

            var completionSource = new TaskCompletionSource<UnityWebRequest>();
            
            var operation = request.SendWebRequest();
            
            operation.completed += _ =>
            {
                try
                {
                    if (request.result == UnityWebRequest.Result.ConnectionError || 
                        request.result == UnityWebRequest.Result.ProtocolError)
                    {
                        completionSource.SetException(new Exception($"WebRequest failed: {request.error}"));
                    }
                    else
                    {
                        completionSource.SetResult(request);
                    }
                }
                catch (Exception ex)
                {
                    completionSource.SetException(ex);
                }
            };

            return completionSource.Task;
        }

        public static async Task<string> GetTextAsync(this UnityWebRequest request)
        {
            var webRequest = await request.SendWebRequestAsync();
            return webRequest.downloadHandler.text;
        }

        public static string GetErrorMessage(this UnityWebRequest request)
        {
            if (request == null)
            {
                return "Request is null";
            }

            if (!string.IsNullOrEmpty(request.error))
            {
                return request.error;
            }

            if (request.result == UnityWebRequest.Result.ConnectionError)
            {
                return "Connection error";
            }

            if (request.result == UnityWebRequest.Result.ProtocolError)
            {
                return $"Protocol error: {request.responseCode}";
            }

            return $"Unknown error: {request.result}";
        }

        public static bool IsSuccess(this UnityWebRequest request)
        {
            return request != null && 
                   request.result == UnityWebRequest.Result.Success && 
                   request.responseCode >= 200 && 
                   request.responseCode < 300;
        }
    }
}