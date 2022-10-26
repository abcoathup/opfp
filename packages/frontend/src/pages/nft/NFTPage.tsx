import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAccount,
  useContractWrite,
  useNetwork,
  usePrepareContractWrite,
  useSwitchNetwork,
  useWaitForTransaction,
} from 'wagmi'
import MagicMirrorManager from '@opfp/contracts/artifacts/contracts/MagicMirrorManager.sol/MagicMirrorManager.json'

import { Button } from '../../components/Button'
import { MirrorCard } from '../../components/MirrorCard'
import { AppLayout } from '../../layout/AppLayout/AppLayout'
import {
  getNftDetails,
  getNftsByAddress,
  shortenAddress,
  shortenString,
} from '../../helpers'
import { NetworkDropdown } from '../../components/NetworkDropdown/NetworkDropdown'
import { NFTPageContent } from '../../components/NFTPageContent'
import { Account } from '../../components/Account'
import { mintDescription, updateDescription } from './constants'
import { getHasNft, getMirroredNFT, useMirror } from '../../hooks/useMirror'
import './NFTPage.scss'
import {
  CONTRACTS,
  MIRROR_MANAGER_NFT_CHAIN_ID,
  MIRROR_NFT_CHAIN_ID,
} from '../../config'
import { ThemedModal } from '../../components/Modal/ThemedModal'

export const NFTPage = () => {
  const { chain } = useNetwork()
  const { switchNetwork } = useSwitchNetwork()
  const { address } = useAccount()
  const navigate = useNavigate()
  const { mint, mintState } = useMirror()
  const [showNfts, setShowNfts] = useState(false)
  const [hasNFT, setHasNft] = useState(false)
  const [mirroredNFT, setMirroredNFT] = useState<any>(null)
  const [nfts, setNfts] = useState<any[]>([])
  const [nft, setNft] = useState<any>(null)
  const [activeNFT, setActiveNFT] = useState(-1)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // const currentContract = nfts[activeNFT]?.collection.address
  // const currentToken = nfts[activeNFT]?.token_id

  const { config: setMirroredNFTConfig } = usePrepareContractWrite({
    addressOrName: CONTRACTS.MIRROR_MANAGER[MIRROR_MANAGER_NFT_CHAIN_ID],
    contractInterface: MagicMirrorManager.abi,
    functionName: 'setMirroredNFT',
    args: [{ token: '0xf5de760f2e916647fd766B4AD9E85ff943cE3A2b', id: 589460 }],
  })

  const {
    data,
    isLoading,
    isSuccess,
    write: update,
  } = useContractWrite(setMirroredNFTConfig)

  const updateState = { data, isLoading, isSuccess }

  const {
    data: updateData,
    isError,
    isLoading: isUpdateLoading,
    status,
  } = useWaitForTransaction({
    hash: updateState?.data?.hash,
  })

  console.log(updateData, isError, isUpdateLoading, status)
  console.log(JSON.stringify(updateState?.data))

  useEffect(() => {
    // Initialization function for page data.
    const initialize = async (address) => {
      setIsPageLoading(true)
      // Get the mirror NFT + load traits if the mirrored NFT exists.
      try {
        const _mirroredNFT = await getMirroredNFT(address)
        setMirroredNFT(_mirroredNFT)

        const opfp = await getNftDetails(
          _mirroredNFT?.token,
          _mirroredNFT?.id.toNumber()
        )

        setNft(opfp)
      } catch (error) {
        console.log(error)
      }

      // Check to see if the user has the mirrored NFT.
      try {
        const _hasNFT = await getHasNft(address)

        setHasNft(_hasNFT !== '')
      } catch (error) {
        setHasNft(false)
        console.log(error)
      }

      // Gets NFTs in users wallet on optimism.
      const _nfts = await getNftsByAddress(address)
      setNfts(_nfts)
      setIsPageLoading(false)
    }

    if (!address) {
      navigate('/connect')
    } else {
      // Load NFTs
      initialize(address)
    }
  }, [address])

  const getNFTImg = () => {
    let img = ''
    nfts.forEach((nft) => {
      if (
        nft?.collection?.address == mirroredNFT?.token &&
        nft?.token_id == mirroredNFT?.id.toNumber()
      ) {
        img = nft.image_url
      }
    })

    return img
  }

  const handleButtonClick = async () => {
    if (!hasNFT && !showNfts) {
      // mint mirror nft
      if (chain?.id !== MIRROR_NFT_CHAIN_ID) {
        await switchNetwork?.(MIRROR_NFT_CHAIN_ID)
      } else {
        setIsModalOpen(true)
        mint?.()
      }
    } else if (hasNFT && !showNfts) {
      // toggle to show NFTs in wallet

      if (chain?.id !== MIRROR_MANAGER_NFT_CHAIN_ID) {
        await switchNetwork?.(MIRROR_MANAGER_NFT_CHAIN_ID)
      } else {
        setShowNfts(true)
      }
    } else {
      // Call magic mint manager to update NFT metadata
      if (chain?.id !== MIRROR_MANAGER_NFT_CHAIN_ID) {
        await switchNetwork?.(MIRROR_MANAGER_NFT_CHAIN_ID)
      } else {
        console.log('UPDATE', update?.())
        setIsModalOpen(true)
        setShowNfts(false)
      }
    }
  }

  let contractAddress = 'Not minted'
  let tokenId = 'Not minted'
  let lastUpdated = 'N/A'
  let buttonText = 'Mint NFT'
  let mirrorCardContent = <div className="connect__mirrorCardContent" />
  let showUpdateNFTHelpMessage = !showNfts

  if (hasNFT) {
    if (nft === null) {
      contractAddress = ''
      tokenId = 'Not set'
      lastUpdated = 'Not set'
      buttonText = 'Set Mirror NFT'
    } else {
      contractAddress = nft?.collection?.address
      tokenId = nft?.token_id
      lastUpdated = shortenString(nft?.collection?.name, 20)
      buttonText = 'Update NFT'
      showUpdateNFTHelpMessage = false
      if (!isPageLoading) {
        const nftImg = getNFTImg()
        mirrorCardContent = <img src={nftImg} alt="Magic Mirror NFT" />
      }
    }
  }

  if (!hasNFT && !showNfts && chain?.id !== MIRROR_NFT_CHAIN_ID) {
    buttonText = 'Switch Network'
  } else if (hasNFT && chain?.id !== MIRROR_MANAGER_NFT_CHAIN_ID) {
    buttonText = 'Switch Network to Update'
  } else if (showNfts) {
    buttonText = 'Confirm'
  }

  const initialize = async (address) => {
    setIsPageLoading(true)
    // Get the mirror NFT + load traits if the mirrored NFT exists.
    try {
      const _mirroredNFT = await getMirroredNFT(address)
      setMirroredNFT(_mirroredNFT)

      const opfp = await getNftDetails(
        _mirroredNFT?.token,
        _mirroredNFT?.id.toNumber()
      )

      setNft(opfp)
    } catch (error) {
      console.log(error)
    }

    // Check to see if the user has the mirrored NFT.
    try {
      const _hasNFT = await getHasNft(address)

      setHasNft(_hasNFT !== '')
    } catch (error) {
      setHasNft(false)
      console.log(error)
    }

    // Gets NFTs in users wallet on optimism.
    const _nfts = await getNftsByAddress(address)
    setNfts(_nfts)
    setIsPageLoading(false)
  }

  const mirrorCardDescription = (
    <div className="nftPage__mirrorCardDescription">
      <p className="title">Magic Mirror NFT</p>
      <div className="row">
        <p className="name">Collection</p>
        <p>{lastUpdated}</p>
      </div>
      <div className="row">
        <p className="name">Token ID</p>
        <p>{tokenId}</p>
      </div>
      <div className="row">
        <p className="name">NFT Contract</p>
        <p>{!hasNFT ? contractAddress : shortenAddress(contractAddress)}</p>
      </div>
    </div>
  )

  const isButtonSpinning = mintState.isLoading || updateState.isLoading

  if (!address) {
    return null
  } else {
    return (
      <>
        <ThemedModal
          isOpen={isModalOpen}
          handleClose={() => {
            setIsModalOpen(false)
            initialize(address)
          }}
        ></ThemedModal>
        <AppLayout
          mirrorCard={
            <MirrorCard
              showSkeleton={isPageLoading}
              content={mirrorCardContent}
              description={mirrorCardDescription}
            />
          }
          content={
            <div className="nftPage__content">
              <NetworkDropdown />
              <Account account={address} />
              {!isPageLoading && !hasNFT ? (
                mintDescription
              ) : !isPageLoading && showUpdateNFTHelpMessage ? (
                updateDescription
              ) : (
                <NFTPageContent
                  showNfts={showNfts}
                  showSkeleton={isPageLoading}
                  nfts={nfts}
                  traits={nft?.traits}
                  activeNFT={activeNFT}
                  setActiveNFT={(nftIndex) => {
                    setActiveNFT(nftIndex)
                  }}
                />
              )}
              {isPageLoading ? null : (
                <div className="card__buttonContainer">
                  {showNfts && (
                    <Button
                      isSecondary={true}
                      onClick={() => {
                        setShowNfts(false)
                      }}
                      isLoading={isButtonSpinning}
                    >
                      <span>{'Back'}</span>
                    </Button>
                  )}
                  <Button
                    isDisabled={showNfts && activeNFT === -1}
                    onClick={handleButtonClick}
                    isLoading={isButtonSpinning}
                  >
                    <span>{buttonText}</span>
                  </Button>
                </div>
              )}
            </div>
          }
        />
      </>
    )
  }
}
