# x42 Protocol xCore

x42 Protocol wallet, it also allows the user to run decentralized applications.
To host said applications look for the latest version of xServer found on x42 Protocol's GitHub page (https://github.com/x42protocol/xCore).

How to install xCore:

01. Open this link: https://github.com/x42protocol/xCore/latest
02. Download the latest appropriate version for your operating system.
03. Open the installer. 
  a. [WINDOWS] if you are prompted to run it by your OS click ‘Yes’.
04. Click ‘I Agree’.
05. Use the default Destination Folder, click ‘Install’.
06. Wait for the installation process to complete.
07. Make sure ‘Run xCore’ is selected and click ‘Finish’.

Now the newest xCore is installed and running on your machine.

FAQ

01. Where can I find my xCore files (including wallets)? 
Close all instances of xCore that you are running and navigate to the specific folder of your operating system:
[WINDOWS] Run (Win+R) %appdata%\x42Node\x42\X42Main\
[macOS] Search within the top right magnifying option for ~/.x42Node/x42/X42Main/
[Linux] Located in your home directory ~/.x42Node/x42/X42Main/

02. My old fullnode wallet is not working, what can I do?

Option 01. Do ‘wallet surgery’, and remove the values inside the ‘externalAddresses’ and ‘internalAddresses’ for all accounts in the wallet. For that edit the WALLETNAME.wallet.json file that you copied, and copy the text inside of it.
Use this website, it will make this editing process much easier: https://jsonformatter.org/
You can use the arrows to collapse the items and press backspace/delete once, and it's done, copy and paste it back to a new wallet file, save it with the NAMETHATYOUWANT.wallet.json.
Click here to see an example of what to look for when doing this process: (https://cdn.discordapp.com/attachments/484409088298582017/670769706831183882/Wallet_Surgery.gif)
Than you will need to run the resyncing process that is located on your advanced tab of xCore.

OR

Option 02. Restore from seed words.

03. I have a different issue, where can I ask for help?
Please head to our Discord (https://discord.gg/jZFR9Ce) and ask one of our @moderators to help you.
