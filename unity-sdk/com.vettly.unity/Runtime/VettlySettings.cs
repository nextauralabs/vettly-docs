using System;
using UnityEngine;

namespace Vettly
{
    [CreateAssetMenu(fileName = "VettlySettings", menuName = "Vettly/Settings")]
    public class VettlySettings : ScriptableObject
    {
        [Header("API Configuration")]
        [SerializeField]
        private string apiKey;

        [SerializeField]
        private Environment environment = Environment.Production;

        [SerializeField]
        private string baseUrlOverride = "";

        [Header("Behavior")]
        [SerializeField]
        private bool failOpen = true;

        [SerializeField]
        private int timeoutSeconds = 30;

        [SerializeField]
        private string policyPreset = "default";

        public string ApiKey => apiKey;
        public Environment Environment => environment;
        public string BaseUrlOverride => baseUrlOverride;
        public bool FailOpen => failOpen;
        public int TimeoutSeconds => timeoutSeconds;
        public string PolicyPreset => policyPreset;

        public string ResolveBaseUrl()
        {
            if (!string.IsNullOrEmpty(baseUrlOverride))
            {
                return baseUrlOverride;
            }

            return environment switch
            {
                Environment.Production => "https://api.vettly.com",
                Environment.Sandbox => "https://api-sandbox.vettly.com",
                _ => "https://api.vettly.com"
            };
        }
    }

    public enum Environment
    {
        Production,
        Sandbox
    }
}