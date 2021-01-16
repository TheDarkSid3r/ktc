var MConHost = class {
    constructor() {
        Swal.fire({
            title: "Connecting\u2026",
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            background: "transparent",
            backdrop: "transparent",
            showClass: {
                popup: "swal2-noanimation"
            },
            hideClass: {
                popup: ""
            }
        });
        var err = () => {
            Swal.fire({
                html: "There was an error connecting to the server. Please try again later.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                background: "transparent",
                backdrop: "transparent",
                showClass: {
                    popup: "swal2-noanimation"
                },
                hideClass: {
                    popup: ""
                }
            });
        };
        $.post(MConConstants.ServerURL + "/create", (data) => {
            if (data.error) return err();
            console.log("Room created with code %s", data.code);
            this.socket = new WebSocket(MConConstants.SocketURL + "?type=game&code=" + data.code);
            this.socket.onerror = console.log;
            this.socket.onclose = console.log;
            this.socket.onmessage = (ev) => {
                var data = JSON.parse(ev.data);
                if (data.roomnotfound) err();
                console.log(data);
            };
            this.socket.onopen = () => {
                this.connected = true;
                console.log("WebSocket opened");
            };
        }).catch(err);
    }
};