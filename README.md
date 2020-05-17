# command-selector-menu (CSM)

Do you use the command-line regularly, are there commands that you need to run with some frequency but with not enough
frequency to actually remember the command of the top of your head? Deleting/pruning old git branches, assigning a
directory to a drive letter to normalize paths during development, runing that command that needs an unnecessarily specific
set of flags to run properly, do all of this without having to find that one specific stack overflow page that contains
the command you're trying to run. Simply add the command you're interested in to the .json configuration file and never
worry about it again!

The command-selector-menu is a Node based command-line management tool that aids in the use of more obsure commands. It
is meant to serve as a bridge betwee the commands you use often enough to justify giving them an alias, and the command
that you would only ever need to run once.

## Installation

There isn't an installer for this application, instead the installation for this application is just a matter of adding
the executable or binary to the command-line path.

### Building The Binary

The on requirement for building the binary for this application would be to have node installed. With node installed the
commands to build the binary once the repository has been pulled are as follows:

```shell
npm install
npm run distribute
```

With those commands having been run the binary can then be found at `./build/csm.exe`.
