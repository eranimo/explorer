# Explorer
An [Electron](http://electron.atom.io/) application for viewing [Historia](https://github.com/eranimo/historia) files

Consists of a few parts:
- a world map that you can pan and zoom
- time controls that allow you to browse through the Historia history
- detailed view describing the pops at each province, how successful they are, what they produced and traded, and who they are trading with. Also shows charts detailing the progress of the similation in a variety of metrics.

## Installation

### Development
1. Download the repository
1. Install [NodeJS v4.4.3 or above](https://nodejs.org/en/download/)
1. In the repo folder, run npm install. This will install the nodejs dependencies.
1. Run `npm run hot-server` to run the development environment.
1. Run `npm run start-hot` to start Explorer in development mode.

### Packaging the App
1. Run `npm run build`
1. Run `npm run package` (to package for your current os)
or run `npm run package-all` to package for all operating systems.


## Screenshots
http://imgur.com/a/GjKFI
