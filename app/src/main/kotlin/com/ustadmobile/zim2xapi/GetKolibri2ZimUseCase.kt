package com.ustadmobile.zim2xapi

import java.io.File

class GetKolibri2ZimUseCase(private val process: ProcessBuilderUseCase) {

    /**
     * Check if kolibri2zim or Docker is available.
     *
     * @param kolibri2zimPath Optional: The path to kolibri2zim binary provided by the user.
     * @return true if kolibri2zim is available or false if Docker is available
     *
     * @throws Exception If neither `kolibri2zim` nor Docker is found in the system's path
     */
    fun isKolibriAvailable(kolibri2zimPath: File?): Boolean {
        val kolibri2zimFile = SysPathUtil.findCommandInPath("kolibri2zim", kolibri2zimPath)
        if (kolibri2zimFile != null && runCommand(kolibri2zimFile)) {
            return true
        }

        val dockerFile = SysPathUtil.findCommandInPath("docker")
        if (dockerFile != null && runCommand(dockerFile)) {
            return false
        } else {
            throw Exception("kolibri2zim or docker not found. Please install it from https://github.com/openzim/kolibri or https://docs.docker.com/get-docker/")
        }
    }

    /**
     * Run the command to verify it's executable.
     *
     * @param commandFile The file representing the command to run.
     * @return true if the command runs successfully.
     */
    private fun runCommand(commandFile: File): Boolean {
        return process.invoke(commandFile.absolutePath, "--version").isNotEmpty()
    }

}