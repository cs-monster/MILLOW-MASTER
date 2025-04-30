require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Load Escrow ABI
const escrowAbi = require(path.join(__dirname, '../src/abis/Escrow.json'));

// Setup provider and contract
const provider = new ethers.JsonRpcProvider(process.env.INFURA_URL);
const escrowContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  escrowAbi,
  provider
);

// 🔹 Get escrow contract balance
app.get('/api/escrow-balance', async (req, res) => {
  try {
    const balance = await escrowContract.getBalance();
    res.json({ balance: ethers.utils.formatEther(balance) });
  } catch (error) {
    console.error('Balance Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Get seller address
app.get('/api/seller', async (req, res) => {
  try {
    const seller = await escrowContract.seller();
    res.json({ seller });
  } catch (error) {
    console.error('Seller Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 🔹 Get details of a specific property by NFT ID
app.get('/api/property/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const buyer = await escrowContract.buyer(id);
    const price = await escrowContract.purchasePrice(id);
    const escrowAmount = await escrowContract.escrowAmount(id);
    const inspectionPassed = await escrowContract.inspectionPassed(id);
    const isListed = await escrowContract.isListed(id);

    res.json({
      id,
      buyer,
      purchasePrice: ethers.utils.formatEther(price),
      escrowAmount: ethers.utils.formatEther(escrowAmount),
      inspectionPassed,
      isListed
    });
  } catch (error) {
    console.error('Property Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
