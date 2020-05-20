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

By default the csm command uses the csm.json located next to the location of the csm binary (`./csm.json`).

### Building The Binary

The on requirement for building the binary for this application would be to have node installed. With node installed the
commands to build the binary once the repository has been pulled are as follows:

```shell
npm install
npm run distribute
```

With those commands having been run the binary can then be found at `./build/csm.exe`.

### Integrating the csm Command into Windows Powershell

While adding the csm executable to the path would be enough to get it working, assuming that the corresonding `csm.json`
file already exists, the default powershell coloring scheme doesn't play well with the default csm output color scheme.
In order to get around this, you must create an alias for the csm command in the powershell profile in order to easily
enable the more legible output color by default.

You'll first need to be acquainted with the powershell
[profile](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_profiles), basically
the powershell equivalent to `.bashrc`. Once you're familiar with the powershell profile you can add the following lines
to your profile to simplify starting the program with the argument's you're interested in using.

```shell
Function <YourFuncName> {csm.exe --color 2 @Args}
Set-Alias -Name csm -Value <YourFuncName>
```
