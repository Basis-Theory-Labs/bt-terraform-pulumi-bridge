import * as pulumi from "@pulumi/pulumi";
import * as basistheory from "@pulumi/basistheory";

const config = new pulumi.Config();
const btApiKey = config.requireSecret("btApiKey");

// Configure the Basis Theory provider with the management API key
const btProvider = new basistheory.Provider("bt-provider", {
  apiKey: btApiKey,
});

const providerOpts: pulumi.CustomResourceOptions = { provider: btProvider };

// 1. Create a private application with proxy and token permissions
const app = new basistheory.Application("bridge-test-app", {
  name: "bridge-test-app",
  type: "private",
  permissions: [
    "token:create",
    "token:read",
    "token:update",
    "token:delete",
  ],
  createKey: false, // we'll manage keys separately
}, providerOpts);

// 2. Create an application key for the application
const appKey = new basistheory.ApplicationKey("bridge-test-app-key", {
  applicationId: app.id,
}, providerOpts);

// 3. Create a proxy that forwards requests to a destination URL
const proxy = new basistheory.Proxy("bridge-test-proxy", {
  name: "bridge-test-proxy",
  destinationUrl: "https://httpbin.org/post",
  applicationId: app.id,
  requireAuth: true,
}, { ...providerOpts, dependsOn: [appKey] });

// 4. Create a webhook that listens for proxy request events
const webhook = new basistheory.Webhook("bridge-test-proxy-webhook", {
  name: "pulumi-bridge-proxy-webhook",
  url: "https://httpbin.org/post",
  events: ["proxy.invoked"],
}, providerOpts);

// Export resource IDs and keys
export const applicationId = app.id;
export const applicationKeyId = appKey.id;
export const applicationKey = appKey.key;
export const proxyId = proxy.id;
export const proxyKey = proxy.key;
export const webhookId = webhook.id;
