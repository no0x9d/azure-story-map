# azure story map

> [!WARNING]  
> Alpha level software to explore azure api

## Setup
It's not necessary to install anything. Simply download the latest release executable for your platform from the releases page.

To work locally install via local git repo:

```bash
git clone <URL>
npm install
npm run dev
```

To install globally via npm
```bash
npm install -g no0x9d/azure-story-map
```

### configuration
To make it easier to use when you configure the base values via environment variables

example: For the project in `https://dev.azure.com/My-Org/My-Project` you can configure the 
following environment variables

```bash
AZURE_PERSONAL_ACCESS_TOKEN=1234567890abcdefghijklmnop
AZURE_BASE_URL=https://dev.azure.com/My-Org
```
