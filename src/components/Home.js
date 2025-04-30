import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

import close from '../assets/close.svg';

const Home = ({ home, provider, account, escrow, togglePop }) => {
  const [hasBought, setHasBought] = useState(false);
  const [hasLended, setHasLended] = useState(false);
  const [hasInspected, setHasInspected] = useState(false);
  const [hasSold, setHasSold] = useState(false);

  const [buyer, setBuyer] = useState(null);
  const [lender, setLender] = useState(null);
  const [inspector, setInspector] = useState(null);
  const [seller, setSeller] = useState(null);

  const [owner, setOwner] = useState(null);

  const fetchDetails = async () => {
    const buyer = await escrow.buyer(home.id);
    const hasBought = await escrow.approval(home.id, buyer);

    const seller = await escrow.seller();
    const hasSold = await escrow.approval(home.id, seller);

    const lender = await escrow.lender();
    const hasLended = await escrow.approval(home.id, lender);

    const inspector = await escrow.inspector();
    const hasInspected = await escrow.inspectionPassed(home.id);

    setBuyer(buyer);
    setHasBought(hasBought);
    setSeller(seller);
    setHasSold(hasSold);
    setLender(lender);
    setHasLended(hasLended);
    setInspector(inspector);
    setHasInspected(hasInspected);
  };

  const fetchOwner = async () => {
    const listed = await escrow.isListed(home.id);
    if (!listed) {
      const owner = await escrow.buyer(home.id);
      setOwner(owner);
    }
  };

  const buyHandler = async () => {
    try {
      const signer = await provider.getSigner();
      const escrowAmount = await escrow.escrowAmount(home.id);

      let tx = await escrow.connect(signer).depositEarnest(home.id, {
        value: escrowAmount
      });
      await tx.wait();

      tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();

      setHasBought(true);
      alert('Property booked successfully!');
    } catch (err) {
      console.error("Buy failed:", err);
      alert("Transaction failed. See console for error.");
    }
  };

  const inspectHandler = async () => {
    try {
      const signer = await provider.getSigner();
      const tx = await escrow.connect(signer).updateInspectionStatus(home.id, true);
      await tx.wait();
      setHasInspected(true);
    } catch (err) {
      console.error("Inspection failed:", err);
    }
  };

  const lendHandler = async () => {
    try {
      const signer = await provider.getSigner();
      const tx1 = await escrow.connect(signer).approveSale(home.id);
      await tx1.wait();

      const price = await escrow.purchasePrice(home.id);
      const escrowAmt = await escrow.escrowAmount(home.id);
      const lendAmt = price - escrowAmt;

      const tx2 = await signer.sendTransaction({
        to: escrow.address,
        value: lendAmt.toString()
      });
      await tx2.wait();

      setHasLended(true);
    } catch (err) {
      console.error("Lending failed:", err);
    }
  };

  const sellHandler = async () => {
    try {
      const signer = await provider.getSigner();

      let tx = await escrow.connect(signer).approveSale(home.id);
      await tx.wait();

      tx = await escrow.connect(signer).finalizeSale(home.id);
      await tx.wait();

      setHasSold(true);
    } catch (err) {
      console.error("Finalizing failed:", err);
    }
  };

  const cancelHandler = async () => {
    try {
      const signer = await provider.getSigner();
      const tx = await escrow.connect(signer).cancelSale(home.id);
      await tx.wait();
      alert("Sale cancelled successfully.");
    } catch (err) {
      console.error("Cancel failed:", err);
      alert("Cancel failed. See console for details.");
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchOwner();
  }, [hasSold]);

  return (
    <div className="home">
      <div className="home__details">
        <div className="home__image">
          <img src={home.image} alt="Home" />
        </div>

        <div className="home__overview">
          <h1>{home.name}</h1>
          <p>
            <strong>{home.attributes[2].value}</strong> bds |
            <strong>{home.attributes[3].value}</strong> ba |
            <strong>{home.attributes[4].value}</strong> sqft
          </p>
          <p>{home.address}</p>
          <h2>{home.attributes[0].value} ETH</h2>

          {owner ? (
            <div className="home__owned">
              Owned by {owner.slice(0, 6)}...{owner.slice(38, 42)}
            </div>
          ) : (
            <div>
              {account === inspector ? (
                <button onClick={inspectHandler} className="home__buy" disabled={hasInspected}>
                  {hasInspected ? 'Inspection Approved' : 'Approve Inspection'}
                </button>
              ) : account === lender ? (
                <button onClick={lendHandler} className="home__buy" disabled={hasLended}>
                  {hasLended ? 'Lent' : 'Approve & Lend'}
                </button>
              ) : account === seller ? (
                <button onClick={sellHandler} className="home__buy" disabled={hasSold}>
                  {hasSold ? 'Sold' : 'Approve & Sell'}
                </button>
              ) : (
                <button onClick={buyHandler} className="home__buy" disabled={hasBought}>
                  {hasBought ? 'Purchased' : 'Buy'}
                </button>
              )}

              {/* Always show Cancel Sale button */}
              <button onClick={cancelHandler} className="home__buy" style={{ backgroundColor: '#f44336' }}>
                Cancel Sale
              </button>

              <button className="home__contact">Contact agent</button>
            </div>
          )}

          <hr />

          <h2>Overview</h2>
          <p>{home.description}</p>

          <hr />

          <h2>Facts and Features</h2>
          <ul>
            {home.attributes.map((attribute, index) => (
              <li key={index}>
                <strong>{attribute.trait_type}</strong> : {attribute.value}
              </li>
            ))}
          </ul>
        </div>

        <button onClick={togglePop} className="home__close">
          <img src={close} alt="Close" />
        </button>
      </div>
    </div>
  );
};

export default Home;
