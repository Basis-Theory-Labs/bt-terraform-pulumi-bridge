# Pulumi Terraform Bridge — Basis Theory

Manages Basis Theory infrastructure using [Pulumi](https://www.pulumi.com/) with a bridged [Terraform provider](https://registry.terraform.io/providers/Basis-Theory/basistheory/latest). This uses Pulumi's [`pulumi package add`](https://www.pulumi.com/docs/iac/get-started/terraform/terraform-providers/) to generate a local TypeScript SDK from the Terraform provider, giving you native Pulumi resource classes for all Basis Theory resources.

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Pulumi CLI](https://www.pulumi.com/docs/install/) v3.113+
- A Basis Theory **Management API Key** ([portal.basistheory.com](https://portal.basistheory.com/))

## Getting Started

### 1. Install dependencies and generate the SDK

```bash
pulumi install
```

This reads the `packages` block in `Pulumi.yaml`, downloads the Terraform provider, generates the TypeScript SDK into `sdks/basistheory/`, and runs `npm install`.

### 2. Create a stack

```bash
pulumi stack init dev
```

### 3. Configure your API key

```bash
pulumi config set --secret btApiKey <YOUR_MANAGEMENT_API_KEY>
```

The API key can also be set via the `BASISTHEORY_API_KEY` environment variable.

### 4. Preview and deploy

```bash
pulumi preview    # review planned changes
pulumi up         # apply changes
```

This provisions:

- **Application** — private application with token CRUD permissions
- **ApplicationKey** — API key for the application
- **Proxy** — request proxy forwarding to a destination URL
- **Webhook** — subscription to `proxy.request` events

### 5. View outputs

```bash
pulumi stack output
```

### 6. Tear down

```bash
pulumi destroy
```

## How the Terraform Bridge Works

`pulumi package add terraform-provider` wraps any Terraform provider for use in Pulumi. It:

1. Downloads the Terraform provider binary
2. Generates Pulumi language bindings (TypeScript SDK in `sdks/`)
3. Registers the package in `Pulumi.yaml`
4. Adds the local SDK as a dependency in `package.json`

The `packages` block in `Pulumi.yaml` records which provider was bridged:

```yaml
packages:
  basistheory:
    source: pulumi/pulumi/terraform-provider
    version: 1.1.1
    parameters:
      - Basis-Theory/basistheory
```

When someone clones the repo, `pulumi install` regenerates everything from this definition.

## Adding a Terraform Provider

```bash
pulumi package add terraform-provider <org>/<provider>
```

For example, to add the Basis Theory provider (already done in this project):

```bash
pulumi package add terraform-provider Basis-Theory/basistheory
```

Or to add additional providers:

```bash
pulumi package add terraform-provider hashicorp/random
```

Each provider gets its own SDK under `sdks/` and is importable as `@pulumi/<provider-name>`.

> **Note:** If a package with the same name exists in the Pulumi Registry, the locally generated version takes precedence in your project.

## Provider Configuration

The Basis Theory provider accepts these settings:

| Property | Environment Variable | Description |
|---|---|---|
| `apiKey` | `BASISTHEORY_API_KEY` | Management API key |
| `apiUrl` | `BASISTHEORY_API_URL` | Base URL (defaults to `https://api.basistheory.com`) |
| `clientTimeout` | `BASISTHEORY_CLIENT_TIMEOUT` | Request timeout in seconds (defaults to 15) |

You can configure the provider explicitly or rely on environment variables:

```typescript
// Explicit provider instance
const provider = new basistheory.Provider("bt-provider", {
  apiKey: config.requireSecret("btApiKey"),
});

// Or set BASISTHEORY_API_KEY and use the default provider
const app = new basistheory.Application("my-app", { ... });
```

## Available Resources

| Resource | Description |
|---|---|
| `Application` | Basis Theory application |
| `ApplicationKey` | API key for an application |
| `Proxy` | Request proxy with tokenization support |
| `Reactor` | Serverless code execution |
| `Webhook` | Event webhook subscription |
| `ApplepayDomain` | Apple Pay domain verification |
| `ApplePayMerchantCertificates` | Apple Pay merchant certificates |
| `ApplePayMerchantRegistration` | Apple Pay merchant registration |
| `GooglePayMerchantCertificates` | Google Pay merchant certificates |
| `GooglePayMerchantRegistration` | Google Pay merchant registration |

## Project Structure

```
.
├── Pulumi.yaml      # Project config with terraform-provider bridge definition
├── index.ts         # Infrastructure definitions
├── package.json     # Node dependencies
├── tsconfig.json    # TypeScript config
└── .gitignore
```

Generated at runtime (not committed):

```
├── sdks/            # Auto-generated Pulumi SDK from the Terraform provider
├── node_modules/    # npm dependencies
├── bin/             # Compiled TypeScript output
└── Pulumi.*.yaml    # Stack-specific config (contains encrypted secrets)
```

## Troubleshooting

**`pulumi install` fails**
- Ensure Pulumi CLI is v3.113+ (`pulumi version`)
- Verify the provider org/name in `Pulumi.yaml` matches the Terraform Registry exactly (case-sensitive)

**SDK type errors after provider version change**
- Delete `sdks/` and `node_modules/`, then re-run `pulumi install`

**API key not found**
- Ensure `pulumi config set --secret btApiKey <key>` was run against the active stack, or set the `BASISTHEORY_API_KEY` environment variable
