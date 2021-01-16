var MobileController = class {
    constructor() {
        this.AskPermission();
        this.rotation = {};
        /* window.addEventListener("resize", () => {
            if (!this.calibrating) return;
            this.DisplayCalibration();
        }, false); */
    }

    get isHorizontal() {
        return window.innerWidth > window.innerHeight;
    }

    AskPermission() {
        Swal.fire({
            title: "Motion Sensors",
            html: "To utilize your device's rotation for the controller, we need access to the rotation sensors of your device.",
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
                        /* if (window.location.hostname != "localhost" || window.location.hostname == "localhost") {
                            r(code);
                            this.DisplayCalibration();
                            return;
                        } */
                        var e = () => {
                            Swal.hideLoading();
                            Swal.showValidationMessage("Invalid connection code.");
                        };
                        $.post(MConConstants.ServerURL + "/room?code=" + code, (s) => {
                            if (s.roomnotfound) return e();
                            this.socket = new WebSocket(MConConstants.SocketURL + "?type=controller&code=" + code);
                            this.socket.onerror = e;
                            this.socket.onclose = e;
                            this.socket.onmessage = (ev) => {
                                var data = JSON.parse(ev.data);
                                if (data.roomnotfound) e();
                                console.log(data);
                            };
                            this.socket.onopen = () => {
                                this.connected = true;
                                r(code);
                                this.DisplayCalibration();
                                console.log("WebSocket opened");
                            };
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

    TestHorizontal() {
        if (!this.isHorizontal) {
            if (!this.testHorVis) {
                this.tswalcreated = false;
                this.testHorVis = true;
                Swal.fire({
                    title: "Error",
                    html: "Please rotate your device screen horizontally for calibration.<br/>Turn off rotation lock if necessary.",
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
                this.calibrationPaused = true;
                clearTimeout(this.calibrationTimeout);
            }
            return true;
        }
    }

    SetupDisplay() {

    }

    DisplayCalibration() {
        setInterval(() => this.socket.send(JSON.stringify({ rotation: this.rotation })), 100);
        /* this.calibrating = true;
        if (this.TestHorizontal()) return;
        this.testHorVis = false;
        if (!this.tswalcreated) {
            this.tswalcreated = true;
            this.calibrationphone = $("<div/>").addClass("calibration-phone");
            this.calibrationspan = $("<span/>").html("Waiting\u2026").appendTo(this.calibrationphone);
            this.calibrationPaused = false;
            this.calibrationIsInRange = false;
            this.ResetCalibrationTimeout();
            Swal.fire({
                title: "Calibration",
                html: "Please place your device on a flat surface with this text facing you.",
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
                    var c = $(Swal.getContent()).append(this.calibrationphone);
                    c.css({ perspective: 500 });
                }
            });
        } */
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
                rotateZ: -90,
                rotateX: 0,
                rotateY: 0,
                scale: 1.2,
                easing: "easeOutElastic",
                duration: 500
            });
            setTimeout(() => {
                Swal.close();
                // Display controls
            }, 1000);
            console.log("Calibrated successfully! Calibration offset: %f", this.calibration);
        }, 1500);
    }

    Calibrate() {
        anime.set(this.calibrationphone[0], { rotateX: this.rotation.y, rotateY: this.rotation.z, rotateZ: this.rotation.x });
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
        if (this.calibrating) if (!this.calibrationPaused) this.Calibrate();
        else this.Rotate();
    }

    Rotate() {
        if (!this.connected) return;

    }
};