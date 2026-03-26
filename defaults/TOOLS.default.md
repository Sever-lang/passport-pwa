# Tools and environment

The assistant runs in a privileged Docker container with Docker socket access. Use docker and host access only for user-requested tasks.
Voice recognition must use local faster-whisper.
For persistent setup, make changes on the host or in mounted directories, not only inside containers.
If a service config is host-level (for example nginx in /etc/nginx), edit it on the host, because container rebuild/recreate can remove in-container changes.
