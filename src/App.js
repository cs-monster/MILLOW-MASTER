import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json';
import Escrow from './abis/Escrow.json';

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [escrow, setEscrow] = useState(null);
  const [account, setAccount] = useState(null);

  const [homes, setHomes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const [home, setHome] = useState({});
  const [toggle, setToggle] = useState(false);

  const [contractInfo, setContractInfo] = useState({ seller: '', balance: '0' });

  const loadBlockchainData = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    const network = await provider.getNetwork();
    const realEstate = new ethers.Contract(
      config[network.chainId].realEstate.address,
      RealEstate,
      provider
    );

    const totalSupply = await realEstate.totalSupply();
    const homes = [];

    for (let i = 1; i <= totalSupply; i++) {
      const uri = await realEstate.tokenURI(i);
      const response = await fetch(uri);
      const metadata = await response.json();
      homes.push({ id: i, ...metadata });
    }

    setHomes(homes);

    const escrow = new ethers.Contract(
      config[network.chainId].escrow.address,
      Escrow,
      provider
    );
    setEscrow(escrow);

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(ethers.utils.getAddress(accounts[0]));

    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0]);
      setAccount(account);
    });

    // 🔗 Load contract info from your backend API
    try {
      const resSeller = await fetch('http://localhost:5000/api/seller');
      const { seller } = await resSeller.json();

      const resBalance = await fetch('http://localhost:5000/api/escrow-balance');
      const { balance } = await resBalance.json();

      setContractInfo({ seller, balance });
    } catch (err) {
      console.error("Failed to load contract info from backend:", err);
    }
  };

  useEffect(() => {
    loadBlockchainData();
  }, []);

  const togglePop = (h) => {
    setHome(h);
    setToggle(true);
    setRecentlyViewed((prev) => {
      const exists = prev.find((item) => item.id === h.id);
      if (exists) return prev;
      return [h, ...prev.slice(0, 4)];
    });
  };

  const toggleFavorite = (homeId) => {
    setFavorites((prev) =>
      prev.includes(homeId) ? prev.filter((id) => id !== homeId) : [...prev, homeId]
    );
  };

  const closePopup = () => setToggle(false);

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      {/* 🔗 Backend Smart Contract Info */}
      <div className="contract__info" style={{ padding: '10px 20px', backgroundColor: '#f5f5f5' }}>
        <p><strong>Contract Seller:</strong> {contractInfo.seller}</p>
        <p><strong>Escrow Balance:</strong> {contractInfo.balance} ETH</p>
      </div>

      {/* Property List */}
      <div className="cards__section">
        <h3>Homes For You</h3>
        <hr />
        <div className="cards">
          {homes.map((home, index) => (
            <div className="card" key={index}>
              <div className="card__image" onClick={() => togglePop(home)}>
                <img src={home.image} alt="Home" />
              </div>
              <div className="card__info">
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> bds |
                  <strong>{home.attributes[3].value}</strong> ba |
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p>{home.address}</p>
              </div>
              <button onClick={() => toggleFavorite(home.id)}>
                {favorites.includes(home.id) ? '💖 Liked' : '🤍 Like'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="cards__section">
          <h3>Your Favorite Properties</h3>
          <hr />
          <div className="cards">
            {homes.filter((h) => favorites.includes(h.id)).map((h, index) => (
              <div className="card" key={index} onClick={() => togglePop(h)}>
                <div className="card__image">
                  <img src={h.image} alt="Home" />
                </div>
                <div className="card__info">
                  <h4>{h.attributes[0].value} ETH</h4>
                  <p>
                    <strong>{h.attributes[2].value}</strong> bds |
                    <strong>{h.attributes[3].value}</strong> ba |
                    <strong>{h.attributes[4].value}</strong> sqft
                  </p>
                  <p>{h.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="cards__section">
          <h3>Recently Viewed Properties</h3>
          <hr />
          <div className="cards">
            {recentlyViewed.map((h, index) => (
              <div className="card" key={index} onClick={() => togglePop(h)}>
                <div className="card__image">
                  <img src={h.image} alt="Home" />
                </div>
                <div className="card__info">
                  <h4>{h.attributes[0].value} ETH</h4>
                  <p>
                    <strong>{h.attributes[2].value}</strong> bds |
                    <strong>{h.attributes[3].value}</strong> ba |
                    <strong>{h.attributes[4].value}</strong> sqft
                  </p>
                  <p>{h.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Property Detail Popup */}
      {toggle && (
        <Home
          home={home}
          provider={provider}
          account={account}
          escrow={escrow}
          togglePop={closePopup}
        />
      )}
    </div>
  );
}

export default App;
