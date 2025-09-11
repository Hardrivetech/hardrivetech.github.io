function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("login-error");

  if (username === "quantumbyte" && password === "hacker") {
    document.getElementById("login-overlay").style.display = "none";
    document.getElementById("desktop").style.display = "block";
    document.getElementById("taskbar").style.display = "flex";
    errorDiv.textContent = "";
  } else {
    errorDiv.textContent = "Access Denied. Invalid credentials.";
  }
}

// Allow login on Enter key
document.addEventListener("DOMContentLoaded", function () {
  const passwordInput = document.getElementById("password");
  if (passwordInput) {
    passwordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        login();
      }
    });
  }
});

function openAbout() {
  const aboutContent = `
    <h2>About @QuantumByte</h2>
    <p>Welcome to my digital realm. I am @QuantumByte, a passionate cybersecurity enthusiast and ethical hacker.</p>
    <p>Specializing in penetration testing, vulnerability assessment, and secure coding practices.</p>
    <p>Always learning, always exploring the depths of the digital world.</p>
  `;

  new WinBox({
    title: "About Me",
    html: aboutContent,
    width: 400,
    height: 300,
    x: 50,
    y: 50,
  });
}

function openProjects() {
  const projectsContent = `
    <h2>My Projects</h2>
    <ul>
      <li><strong>SecureChat</strong> - Encrypted messaging application</li>
      <li><strong>VulnScanner</strong> - Automated vulnerability scanner</li>
      <li><strong>CryptoWallet</strong> - Secure cryptocurrency wallet</li>
      <li><strong>FirewallSim</strong> - Network firewall simulation tool</li>
    </ul>
    <p>Check out my GitHub for more projects and contributions!</p>
  `;

  new WinBox({
    title: "Projects",
    html: projectsContent,
    width: 500,
    height: 400,
    x: 100,
    y: 100,
  });
}

function openContact() {
  const contactContent = `
    <h2>Get In Touch</h2>
    <p>Email: quantumbyte@hacker.com</p>
    <p>GitHub: <a href="https://github.com/Hardrivetech" target="_blank">@QuantumByte</a></p>
    <p>Let's connect and discuss cybersecurity, coding, or any tech topics!</p>
  `;

  new WinBox({
    title: "Contact",
    html: contactContent,
    width: 450,
    height: 350,
    x: 150,
    y: 150,
  });
}

function openTerminal() {
  const terminalContent = `
    <div id="terminal-output" style="font-family: monospace; background: black; color: lime; padding: 10px; height: 200px; overflow-y: auto; white-space: pre-wrap;">
$ echo "Welcome to QuantumByte's Terminal"
Welcome to QuantumByte's Terminal
$
    </div>
    <input id="terminal-input" type="text" style="width: 100%; background: black; color: lime; border: none; outline: none; font-family: monospace;" placeholder="Type command here..." />
  `;

  const winbox = new WinBox({
    title: "Terminal",
    html: terminalContent,
    width: 500,
    height: 300,
    x: 200,
    y: 200,
  });

  // Wait for the winbox to be rendered
  setTimeout(() => {
    const input = document.getElementById("terminal-input");
    const output = document.getElementById("terminal-output");
    let commandHistory = [];
    let historyIndex = -1;

    input.focus();

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        const command = input.value.trim();
        if (command) {
          commandHistory.push(command);
          historyIndex = commandHistory.length;
          processCommand(command, output);
        }
        input.value = "";
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex--;
          input.value = commandHistory[historyIndex];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          input.value = commandHistory[historyIndex];
        } else {
          historyIndex = commandHistory.length;
          input.value = "";
        }
      }
    });
  }, 100);
}

function processCommand(command, output) {
  output.textContent += command + "\n";
  const args = command.split(" ");
  const cmd = args[0].toLowerCase();

  switch (cmd) {
    case "ls":
      if (args.includes("-la")) {
        output.textContent += "total 0\n";
        output.textContent += "drwxr-xr-x  5 user  staff  160 Apr 27 12:00 .\n";
        output.textContent +=
          "drwxr-xr-x  3 user  staff   96 Apr 27 11:59 ..\n";
        output.textContent +=
          "-rw-r--r--  1 user  staff    0 Apr 27 12:00 secret.txt\n";
      } else {
        output.textContent +=
          "Desktop  Documents  Downloads  Pictures  Projects\n";
      }
      break;
    case "pwd":
      output.textContent += "/home/quantumbyte\n";
      break;
    case "echo":
      output.textContent += args.slice(1).join(" ") + "\n";
      break;
    case "whoami":
      output.textContent += "quantumbyte\n";
      break;
    case "clear":
      output.textContent = "$ ";
      return;
    case "help":
      output.textContent +=
        "Available commands: ls, pwd, echo, whoami, clear, help\n";
      break;
    default:
      output.textContent += `Command not found: ${cmd}\n`;
  }
  output.textContent += "$ ";
  output.scrollTop = output.scrollHeight;
}

let startMenuWinbox = null;

function openStartMenu() {
  // Close existing start menu if open
  if (startMenuWinbox) {
    startMenuWinbox.close();
    startMenuWinbox = null;
    return;
  }

  const menuContent = `
    <div style="padding: 10px;">
      <button onclick="logout()" style="display: block; width: 100%; margin-bottom: 10px; padding: 8px; background: #333; color: #fff; border: none; cursor: pointer;">Logout</button>
      <button onclick="openAbout()" style="display: block; width: 100%; margin-bottom: 10px; padding: 8px; background: #333; color: #fff; border: none; cursor: pointer;">About</button>
      <button onclick="openTerminal()" style="display: block; width: 100%; padding: 8px; background: #333; color: #fff; border: none; cursor: pointer;">Terminal</button>
    </div>
  `;

  startMenuWinbox = new WinBox({
    title: "Start Menu",
    html: menuContent,
    width: 200,
    height: 300,
    x: 0,
    y: window.innerHeight - 350,
    onclose: function () {
      startMenuWinbox = null;
    },
  });
}

function logout() {
  // Close all winboxes first
  const winboxes = document.querySelectorAll(".winbox");
  winboxes.forEach((wb) => wb.remove());

  document.getElementById("login-overlay").style.display = "flex";
  document.getElementById("desktop").style.display = "none";
  document.getElementById("taskbar").style.display = "none";
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("login-error").textContent = "";
}

// Clock update
function updateClock() {
  const clock = document.getElementById("clock");
  if (!clock) return;
  const now = new Date();
  clock.textContent = now.toLocaleTimeString();
}

setInterval(updateClock, 1000);
updateClock();
