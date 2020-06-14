# command-selector-menu JSON documentation

The options for the Command Selector Menu are given in a list of potentially recursive menu options. The parent option
in the JSON is named `catComList`, inside of this option is a list of Category/Command options. Each of the
Category/Command options that is listed contains a name and a description as well as a set of options that are used
whenever it is a Command option that is listed.

The Category/Command option has the following structure:

TODO: BMG (Jun. 11, 2020) Add the typings for each one of the options in the structure

* **name**: A string that contains the name of the Category or Command that is being defined.
* **subCatCom**: Either a list of more Category/Command options, or a list of command strings that are going to be run.
* **description** (Optional): A string that contains a description of the Category or Command that is being defined.
* **confirm** (Optional): Prompt the user for a confirmation before the command is run.
* **async** (Optional): Run the list of commands that were defined asynchronously (All at the same time).
* **singleSession** (Optional): If the async option has been left false, run the list of commands in the same session.
This allows for environment variables to be preserved between commands.
* **execEnv** (Optional): The execution environment under which to run the command that was provided. The possible
options that can be taken here depend on the operating system in which is being run, you can see the details
[here](##execEnv).

The following is an example structure for the JSON file that could be provided to the application:

```
└── catComList
    ├── git (Category)
    |   ├── Get branch hash (Command)
    |   └── Delete finished branches (Command)
    ├── SSH (Category)
    |   ├── SSH into Server1 (Command)
    |   └── Setup SSH tunnel into Server2 (Command)
    ├── Win Powershell (Category)
    |   ├── Open File Explorer here (Command)
    |   └── Open VSCode Here (Command)
    ├── As (Category)
    |   └── Many (Category)
    |       └── Categories (Category)
    |           └── As (Category)
    |               └── You'd (Category)
    |                   └── Like (Command)
    └── Update packages (Command)
```

## execEnv

The execution environment is an option that can be associated with the command to ensure that it is being run under in
the correct environment. For example, the `ls` command in windows is only available under Powershell and bash through
WSL, so if you want to run that command you sould specify the `Powershell` in the `execEnv` option for that command to
ensure it doesn't fail.

Below is the set of execution environment that are supported in the various Operating Systems:

1. Windows
    * `cmd`: Command Prompt
    * `powershell`: Windows Powershell
    * `bash`: bash through WSL (if WSL has been installed and setup)
1. Linux
    * `bash`: bash or Bourne Again SHell

## Command Examples

Below are a set of command examples to show the possibilities of the Commands that can be created. At the end of the
day, the command-selector-menu basically allows you to make small shell scripts that can be run easily, so anything that
can be done with a shell script can be done with the command-selector-menu.

### General

#### Open current directory in Visual Studio Code

```JSON
{
    "name": "Open VSCode Here",
    "description": "Open the current directory in VS Code.",
    "subCatCom": [
        "code ."
    ]
}
```

#### Open File in new Visual Studio Code window

```JSON
{
    "name": "Open Profile in VSCode",
    "description": "Open the powershell profile in a VSCode window.",
    "subCatCom": [
        "code -n <File_Location>"
    ],
}
```

### Windows

#### Open current directory in File Explorer

```JSON
{
    "name": "Open Explorer Here",
    "description": "Open the Windows explorer in the current directory.",
    "subCatCom": [
        "start ."
    ]
}
```

#### Prompt the user for input

Using powershell, you can create a script which prompts the user for input before running the command you're interested
in running.

```JSON
{
    "name": "Delete remote and local branch",
    "description": "Delete specific branch from local and remote.",
    "subCatCom": [
        "git remote prune origin",
        "git branch -la",
        "$branch = Read-Host 'What branch do you want to delete'",
        "git branch -d $branch",
        "git push origin --delete $branch"
    ],
    "execEnv": "powershell",
    "singleSession": true
}
```

The script:

1. Prunes any remote branches that are no longer present based on what is present in origin.
2. Print all the git branches that are currently present.
3. Prompts the user for the name of the branch they want to delete.
4. Delete the local branch first, in case there is no corresponding remote branch for the given branch name.
5. Delete the remote branch.

A few things to note with this:

* This particular script uses the powershell execution environment. You could technically also use the windows command
  prompt or bash (if WSL is installed), but powershell is included on all windows installs and it looks significantly
  cleaner than the equivalent command prompt script.
* This script is run in singleSession mode, otherwise the declaration of the `$branch` environment variable wouldn't
  carry over between commands.

#### You want to run a command, but not within the command-selector-menu

While the command-selector-menu can easily handle executing commands like `ssh` and `vim` as child-processes, it is
understandable not wanting to start an ssh session as a child-process. In these cases, it is possible to simply place
the command you're interested in running on your clipboard then running it yourself/sharing it with someone else.

```JSON
{
    "name": "SSH to PC1",
    "description": "Place the ssh command to connect to PC1 into the clipboard",
    "subCatCom": [
        "Set-Clipboard -Value 'ssh <user>@<pc-location> [arguments]'",
    ],
    "execEnv": "powershell"
}
```
