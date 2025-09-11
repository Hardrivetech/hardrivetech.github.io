function openAbout() {
  const aboutContent = `
    <h2>About @QuantumByte(Hacker)</h2>
    <p>Welcome to my digital realm. I am @QuantumByte(Hacker), a passionate cybersecurity enthusiast and ethical hacker.</p>
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
    <p>GitHub: <a href="https://github.com/QuantumByte" target="_blank">@QuantumByte</a></p>
    <p>Twitter: <a href="https://twitter.com/QuantumByteHacker" target="_blank">@QuantumByteHacker</a></p>
    <p>Discord: QuantumByte#1337</p>
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
