package com.ustadmobile.zim2xapi

import com.ustadmobile.zim2xapi.utils.SysPathUtil
import java.io.File

class FindKolibri2ZimUseCase {

    /**
     * Check if kolibri2zim or Docker is available.
     *
     * @param kolibri2zimPath Optional: The path to kolibri2zim binary provided by the user.
     * @param dockerPath Optional: The path to docker binary provided by the user
     * @param outputDir: Output Directory
     * @return true if kolibri2zim is available or false if Docker is available
     *
     * @throws Exception If neither `kolibri2zim` nor Docker is found in the system's path
     */
    operator fun invoke(
        kolibri2zimPath: File?,
        dockerPath: File?,
        outputDir: File
    ): List<String> {
        val kolibri2zimFile = SysPathUtil.findCommandInPath("kolibri2zim", kolibri2zimPath)
        if (kolibri2zimFile != null) {
            return listOf(kolibri2zimFile.absolutePath)
        }

        val dockerFile = SysPathUtil.findCommandInPath("docker", dockerPath)
        if (dockerFile != null) {
            return buildList {
                add(dockerFile.absolutePath)
                add("run")
                // name of docker container - to be deleted later
                add("--rm")
                // Volume mapping between the host and the container
                add("-v")
                add("${outputDir.absolutePath}:/output")
                // Docker image to use (openzim Kolibri image)
                add("ghcr.io/openzim/kolibri")
                // Command to execute inside the container
                add("kolibri2zim")
            }
        } else {
            throw Exception("kolibri2zim or docker not found. Please install it from https://github.com/openzim/kolibri or https://docs.docker.com/get-docker/")
        }
    }

    /* */
    /**
     * Run the command to verify it's executable.
     *
     * @param commandFile The file representing the command to run.
     * @return true if the command runs successfully.
     *//*
    private fun runCommand(commandFile: File): Boolean {
        return process.invoke(commandFile.absolutePath, "--version").isNotEmpty()
    }*/

}