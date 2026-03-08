#define _GNU_SOURCE
#include <stdio.h>
#include <dlfcn.h>
#include <unistd.h>

typedef int (*execve_func_t)(const char *pathname, char *const argv[], char *const envp[]);

int execve(const char *pathname, char *const argv[], char *const envp[]) {
    fprintf(stderr, "HOOK: execve(%s)\n", pathname);
    execve_func_t old_execve = (execve_func_t)dlsym(RTLD_NEXT, "execve");
    return old_execve(pathname, argv, envp);
}
