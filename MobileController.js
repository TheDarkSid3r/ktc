var MobileController = class {
    constructor() {
        this.AskPermission();
        this.rotation = {};
    }

    get isHorizontal() {
        return screen.availHeight > screen.availWidth;
    }

    AskPermission() {
        Swal.fire({
            title: "Motion Sensors",
            html: "To utilize your device's rotation for the controller, we need access to the rotation sensors of your phone.",
            confirmButtonText: "Request",
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((r) => {
            if (r.isConfirmed) {
                this.SetHandlers();
            }
        });
    }

    SetHandlers() {
        var set = () => {
            window.addEventListener("deviceorientation", (e) => this.HandleOrientation(e));
            Swal.fire({
                title: "Connection",
                html: "Please enter your 4-digit connection code.",
                allowOutsideClick: false,
                allowEscapeKey: false,
                confirmButtonText: "Connect",
                input: "text",
                inputAttributes: {
                    placeholder: "Connection code",
                    maxlength: 4
                },
                inputValidator: (v) => {
                    if (v.length < 4) return "Please enter a code.";
                    if (/[^0-9]/g.test(v)) return "Code must be numerical.";
                },
                preConfirm: (code) => {
                    Swal.showLoading();
                    return new Promise((r) => {
                        if (window.location.hostname != "localhost") {
                            r(code);
                            this.DisplayCalibration();
                            return;
                        }
                        var url = window.location.hostname == "localhost" ? "http://localhost:2223" : "https://ktane-mobilecontroller.herokuapp.com";
                        var e = () => {
                            Swal.hideLoading();
                            Swal.showValidationMessage("Invalid connection code");
                        };
                        $.post(url + "/room", { code }, (s) => {
                            if (s.roomnotfound) return e();
                            this.socket = new WebSocket(url + "?type=controller&code=" + code);
                            this.socket.onerror = e;
                            this.socket.onclose = e;
                            this.socket.onmessage = (ev) => {
                                var data = JSON.parse(ev.data);
                                if (data.roomnotfound) e();
                            };
                            this.socket.onopen = () => this.connected = true;
                        }).catch(e);
                        /* setTimeout(() => {
                            r(code);
                            this.DisplayCalibration();
                        }, 1000); */
                    });
                }
            });
            //this.DisplayCalibration();
        };
        if (typeof DeviceOrientationEvent.requestPermission === "function") {
            DeviceOrientationEvent.requestPermission()
                .then((s) => {
                    if (s === "granted") set();
                })
                .catch(console.error);
        } else {
            console.warn("Error requesting permissions");
            set();
        }
    }

    DisplayCalibration() {
        Swal.fire({
            title: "Calibration",
            html: "Please place your device on a flat surface (horizontally) facing you.",
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
            },
            didRender: () => {
                this.calibrationphone = $("<div/>").addClass("calibration-phone").appendTo(Swal.getContent());
                this.calibrationspan = $("<span/>").html("Waiting\u2026").appendTo(this.calibrationphone);
                this.calibrating = true;
                this.calibrationIsInRange = false;
                this.ResetCalibrationTimeout();
            }
        });
    }

    ResetCalibrationTimeout() {
        clearTimeout(this.calibrationTimeout);
        this.calibrationTimeout = setTimeout(() => {
            if (!this.calibrationIsInRange) return;
            this.calibrating = false;
            this.calibration = this.rotation.x - 90;
            this.calibrationspan.css({ fontSize: 20 }).html("Calibrated!");
            anime({
                targets: this.calibrationphone[0],
                rotate: -90,
                scale: 1.2,
                easing: "easeOutElastic",
                duration: 500
            });
            setTimeout(() => {
                Swal.close();
                console.log("a");
            }, 1000);
            console.log("Calibrated successfully! Calibration offset: %f", this.calibration);
        }, 1500);
    }

    Calibrate() {
        anime.set(this.calibrationphone[0], { rotate: this.rotation.x });
        var leniency = 6; //in each direction
        var values = [this.rotation.y, this.rotation.z];
        var isInRange = values.every((v) => v >= -leniency && v <= leniency);
        if (isInRange != this.calibrationIsInRange || this.calibrationlastx == null || this.rotation.x <= this.calibrationlastx - leniency || this.rotation.x >= this.calibrationlastx + leniency) {
            this.ResetCalibrationTimeout();
            this.calibrationIsInRange = isInRange;
            this.calibrationlastx = this.rotation.x;
        }
    }

    HandleOrientation(e) {
        var x = e.alpha;
        var y = e.beta;
        var z = e.gamma;
        this.rotation = { x, y, z };
        if (this.calibrating) this.Calibrate();
        else this.Rotate();
    }

    Rotate() {
        if (!this.connected) return;
    }
};