# Desired Feature List

This markdown file contains a list of the possible ideas and features that could be implemented into this applicaiton.
It isn't supposed to serve as a definitive list of features that are going to be added to the project, but as a way of
collecting possible ideas that could be incorporated. Also, I don't want the source files to be littered with NOTE and
TODO comments that talk about potential things to do in the future.

* Expand documentation to give examples of how to make the json that will be provided to the program.
* Add a return to the JSON verification to better indicate where the problem in the JSON is present.
* Add documentation for the error return numbers that can possibly be returned by the program.
* Add Typescript linting to the project.
* Add support for displaying too many commands given the size of the user's current terminal.
* Go through and update the Errors that are generated throughout the application to no longer be generic Error instances

## Not priority

* Add directory specific `csm.json` support. More specifically, give the application the ability to see if there is a
`csm.json` in the current directory the user is in and if so add the CatCom objects to the set of CatCom objects from
the main `csm.json` file that is provided to the binary.
* Create an AWS account, specifically an S3 bucket, for the project to distribute pre-made versions of the binary.
* Add support for pulling/pushing the `csm.json` using git gists, or any other file repository.
* Fix project debugging in VSCode through WSL, it currently returns an error saying it is unable to find the location of
the file in question.
* Add testing to the application. This will likely need to also include platform specific testing to be effective.
  * I actually don't know what would be tested, specifically I am not aware of a way of emulating user-input to
    properly test the navigation through the configuration that was passed through to the program. I could potentially
    test shell executions, but the shell execution is basically just a wrapper for the node child_process functions so
    there isn't much to test there.
* Add dynamic environment selection for linux environments.
  * It is not a given that the bash environment is the default, or even exists, within a given linux distribution. Using
    the confirmEnvExistance to cycle through the set of possible Linux environments until one that exists would address
    this, but would add some amount of delay before the selected command is finally run (though I think the worst case
    scenario for this check would be roughly a 200 ms delay)
    * confirmEnvExistance depends on the whereis command, which is included with the util-linux package. If this would
      be implemented, a check to see if the whereis command exists would also be necessary.
  * That being said, it is the most prevalent command line, and I'd be willing to bet that the systems where having csm
    makes sense has 100% overlap with systems that have the bash environment (even if it isn't the default environment).
