const accounts = {
  mesquka: '0xD86518b29BB52a5DAC5991eACf09481CE4B0710d',
  JoshuaTobkin: '0xD86518b29BB52a5DAC5991eACf09481CE4B0710d',
};

async function getAddress(username) {
  return accounts[username];
}

export {
  getAddress,
};
