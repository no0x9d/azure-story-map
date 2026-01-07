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
For the first run you need to configure the access to your azure devops instance. You need to do this via the 
'Settings' dialog accessible from the top left.

example: For the project in `https://dev.azure.com/My-Org/My-Project` you can configure the Base URL as `https://dev.azure.com/My-Org`
You need to create a personal access token (PAT) with at least 'Work Items (read)' scope.
