import { ConnectKitButton } from 'connectkit'
import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'

import storeApi from 'apis/store-api'
import {
  DetailBaseStats,
  DetailDescription,
  DetailIdentify,
  DetailPreview,
  DetailPriceAndStock
} from 'components/store'
import { Button } from 'components/ui/button'
import { useToast } from 'components/ui/use-toast'
import { Breadcrumb, LoadingScreen } from 'components/utils'
import { bnbChain } from 'configs/customChains'
import { DanceTokenABI } from 'contract/abis'
import { RG02_NFT_SHOP_ADDRESS, RG02_TOKEN_ADDRESS } from 'contract/addresses'
import { useAllowance, useApprove } from 'hooks'
import formatBalance from 'utils/formatBalance'

const StoreItemPage = () => {
  const navigation = useNavigate()
  const { pathname } = useLocation()
  const { packId } = useParams()

  const [breadcrumb, setBreadcrumb] = useState([])
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [notfound, setNotfound] = useState(false)
  const [purchasing, setPurchasing] = useState(false)

  const { address } = useAccount()
  const { toast } = useToast()

  const {
    isLoading: isCheckingAllowance,
    isApproved,
    refetch: refetchAllowance
  } = useAllowance({
    abi: DanceTokenABI,
    args: [address, RG02_NFT_SHOP_ADDRESS[bnbChain.id]],
    contractAddress: RG02_TOKEN_ADDRESS[bnbChain.id],
    price: data?.price || 0
  })
  const {
    write: writeApprove,
    isLoading: isApproving,
    isCheckingWallet,
    isSuccess: isApproveSuccess
  } = useApprove({
    abi: DanceTokenABI,
    args: [
      RG02_NFT_SHOP_ADDRESS[bnbChain.id],
      data?.price
        ? formatBalance.formatFixedNumberToBigNumber(data.price).toString()
        : 0n
    ],
    contractAddress: RG02_TOKEN_ADDRESS[bnbChain.id],
    onSuccess: () => {
      const sti = setInterval(() => {
        if (isApproved) clearInterval(sti)
        refetchAllowance()
      }, 5000)
    }
  })

  const getData = useCallback(async () => {
    try {
      const result = await storeApi.getItemByPackId(packId)
      setData(result.data)
      setBreadcrumb(() => [
        { name: 'Store', link: '/store' },
        { name: 'Item', link: pathname },
        { name: result.data.name }
      ])
    } catch (error) {
      console.error(error)
      toast({ title: 'Error', description: "Can't get item data" })
      setNotfound(true)
    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }
  }, [packId, pathname, toast])

  const handlePurchase = useCallback(async () => {
    setPurchasing(true)
    try {
    } catch (error) {
      console.error(error)
    } finally {
      setPurchasing(false)
    }
  }, [])

  useEffect(() => {
    getData()
  }, [getData])

  if (loading) {
    return <LoadingScreen content={'Getting item'} />
  }

  if (!packId || notfound)
    return (
      <motion.section
        className='ignore-nav flex h-screen flex-col items-center justify-center gap-4 text-center'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <h1 className='font-bai-jamjuree text-5xl font-bold text-primary'>
          Oops
        </h1>
        <p>We can't find the item you were looking for</p>
        <Button className='text-white' onClick={() => navigation('/')}>
          Go to Store
        </Button>
      </motion.section>
    )
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className='ignore-nav font-secondary min-h-screen w-full p-0 px-[10px]
        font-bai-jamjuree text-neutral-50 md:p-5'
      >
        <div
          className='mx-auto mb-20 mt-5 w-full space-y-[10px] md:mt-10
          lg:mb-10 lg:space-y-5 
          xl:max-w-[980px]'
        >
          <Breadcrumb data={breadcrumb} />

          <div
            className='font-primary flex flex-wrap
            space-y-[10px] rounded-[5px] bg-primary-foreground
            p-[10px] md:gap-5 md:space-y-0 md:p-5'
          >
            <DetailPreview imageUrl={data.imageUrl} videoUrl={data.videoUrl} />

            <div className='w-full space-y-[26px] md:w-[calc(100%-388px-1.25rem)]'>
              <div className=''>
                <DetailIdentify name={data.name} />
                <DetailPriceAndStock
                  className='mt-[10px] md:mt-5'
                  price={data.price}
                  unit='usd'
                  stock={data.amountInStock}
                />
              </div>

              <div className='my-[10px] md:mb-[15px] md:mt-5'>
                {data.amountInStock === 0 ? null : (
                  <div>
                    {!address ? (
                      <ConnectKitButton.Custom>
                        {({ show, isConnecting }) => (
                          <Button
                            className='w-full text-white'
                            size='lg'
                            disable={isConnecting}
                            onClick={show}
                          >
                            {isConnecting
                              ? 'Submit on wallet'
                              : 'Connect wallet to order'}
                          </Button>
                        )}
                      </ConnectKitButton.Custom>
                    ) : isApproved || isApproveSuccess ? (
                      <Button
                        className='w-full'
                        size='lg'
                        variant={'secondary'}
                        loading={purchasing}
                        disable={loading || isApproved}
                        onClick={() => handlePurchase()}
                      >
                        Purchase
                      </Button>
                    ) : (
                      <Button
                        className='w-full'
                        size='lg'
                        variant={'secondary'}
                        loading={
                          isApproving || isCheckingAllowance || isCheckingWallet
                        }
                        disabled={!writeApprove}
                        onClick={() => {
                          writeApprove?.()
                        }}
                      >
                        Approve
                      </Button>
                    )}

                    <p className='mt-[7px] text-center font-bai-jamjuree text-sm text-[#ba92ba]'>
                      We accept payments by crypto
                    </p>
                  </div>
                )}
              </div>

              <DetailDescription
                gameDescription={data.gameDescription || ''}
                collectionDescription={data.collectionDescription || ''}
                itemDescription={data?.detail?.itemDescription || ''}
              />

              <DetailBaseStats
                dp={data?.detail?.dp || 0}
                mdp={data?.detail?.mdp || 0}
                earnPoint={data?.detail?.earnPoint || 0}
                rarity={data?.detail?.rarity}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default StoreItemPage
