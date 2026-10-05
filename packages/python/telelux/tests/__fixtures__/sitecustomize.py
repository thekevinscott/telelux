# unshare -rn is denied on GitHub runners and dev machines, so the e2e tier cuts the network inside the interpreter.
import socket


def refuse(*args, **kwargs):
    raise OSError("networking is disabled in this environment")


def local_only(connect):
    def guarded(self, address):
        if self.family != socket.AF_UNIX:
            refuse()
        return connect(self, address)

    return guarded


socket.socket.connect = local_only(socket.socket.connect)
socket.socket.connect_ex = local_only(socket.socket.connect_ex)
socket.create_connection = refuse
socket.getaddrinfo = refuse
