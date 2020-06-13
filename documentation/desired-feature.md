# Desired Feature List

This markdown file contains a list of the possible ideas and features that could be implemented into this applicaiton.
It isn't supposed to serve as a definitive list of features that are going to be added to the project, but as a way of
collecting possible ideas that could be incorporated. Also, I don't want the source files to be littered with NOTE and
TODO comments that talk about potential things to do in the future.

* Add directory specific `csm.json` support. More specifically, give the application the ability to see if there is a
`csm.json` in the current directory the user is in and if so add the CatCom objects to the set of CatCom objects from
the main `csm.json` file that is provided to the binary.
* Create an AWS account, specifically an S3 bucket, for the project to distribute pre-made versions of the binary.
* Expand documentation to give examples of how to make the json that will be provided to the program.
* Add support for pulling/pushing the `csm.json` using git gists, or any other file repository.
* Add JSON verification into the application.
* Add testing to the application. This will likely need to also include platform specific testing to be effective.
