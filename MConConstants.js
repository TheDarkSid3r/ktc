var MConConstants = {
    // ServerURL: window.location.hostname == "localhost" ? "http://localhost:2223" : "https://ktane-mobilecontroller.herokuapp.com"
    ServerURL: "http://localhost:2223"
};
MConConstants.SocketURL = MConConstants.ServerURL.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://");