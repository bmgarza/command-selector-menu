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
