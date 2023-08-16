import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/solid'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import storeApi from 'apis/store-api'
import BannerImage from 'assets/img/marketplace-banner.jpg'
import { Banner, ListItemInStore, Statistic } from 'components/store'
import { Button } from 'components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from 'components/ui/command'
import { Input } from 'components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from 'components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from 'components/ui/select'
import { useToast } from 'components/ui/use-toast'
import { raritysItem, sortsItem, typesItem } from 'data/store'
import { useInput } from 'hooks'
import { cn } from 'lib/utils'

Object.fromMEntries = (params) => {
  const obj = {}
  for (const key of params.keys()) {
    if (params.getAll(key).length > 1) {
      obj[key] = params.getAll(key)
    } else {
      obj[key] = params.get(key)
    }
  }
  return obj
}

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [sortValue, setSortValue] = useState(searchParams.get('sort'))
  const [rarityValue, setRarityValue] = useState(
    searchParams.getAll('detail.rarity')
  )
  const [typeValue, setTypeValue] = useState(searchParams.getAll('detail.type'))
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 0,
    totalPages: 0,
    currentPage: 1,
    slNo: 1,
    hasPrevPage: false,
    hasNextPage: true,
    prev: null,
    next: 2
  })
  const [loading, setLoading] = useState(false)

  const { value: searchInput, bind } = useInput()
  const { toast } = useToast()

  const sortItemSelectedConfig = useMemo(() => {
    return sortsItem.find((item) => item.value === sortValue)
  }, [sortValue])

  const searchParamValues = useMemo(
    () => Object.fromMEntries(searchParams),
    [searchParams]
  )

  const getStoreData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await storeApi.getItems(searchParamValues)

      console.log(result.data)
      setData(result.data.data)
      setPagination(result.data.paginator)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Cannot get store item'
      })
      console.error(error)
    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 700)
    }
  }, [searchParamValues, toast])

  const getDataWhenScrollDown = useCallback(async () => {
    if (pagination.hasNextPage) {
      setLoading(true)
      try {
        const result = await storeApi.getItems({
          ...searchParamValues,
          page: pagination.next
        })
        setData((prev) => [...prev, ...result.data.data])
        setPagination(result.data.paginator)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Cannot get store item'
        })
        console.error(error)
      } finally {
        setTimeout(() => {
          setLoading(false)
        }, 2000)
      }
    }
  }, [pagination.hasNextPage, pagination.next, searchParamValues, toast])

  useEffect(() => {
    getStoreData()
  }, [getStoreData])

  return (
    <div className='ignore-nav'>
      <Banner img={BannerImage} title={'Marketplace'} />
      <section className='ctn py-8'>
        <div className='mb-[23px] border-2 border-border-foreground'>
          <Statistic
            day={{
              one: {
                totalVolume: 0,
                totalSale: 0,
                id: 0
              },
              seven: {
                totalVolume: 0,
                totalSale: 0,
                id: 1
              },
              thirty: {
                totalVolume: 0,
                totalSale: 0,
                id: 2
              }
            }}
          />
        </div>
        <div className='mb-[29px] flex w-full items-center justify-between'>
          <Input
            parentClass='w-full max-w-[690px]'
            type='text'
            placeholder='Type a command or search...'
            icon={{ icon: MagnifyingGlassIcon }}
            {...bind}
            onKeyUp={(e) => {
              if (e.key === 'Enter') {
                searchInput
                  ? setSearchParams({
                      ...searchParamValues,
                      search: searchInput
                    })
                  : setSearchParams(() => {
                      const searchParamValuesClone = { ...searchParamValues }
                      delete searchParamValuesClone.search
                      return searchParamValuesClone
                    })
              }
            }}
          />
          <div className='flex items-center gap-[18px]'>
            <Select
              onValueChange={(value) => {
                setSortValue(value)
                setSearchParams({
                  ...searchParamValues,
                  sort: value
                })
              }}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue
                  placeholder={
                    sortValue ? (
                      <div className='flex items-center gap-2'>
                        <sortItemSelectedConfig.icon className='h-4 w-4 text-white' />
                        {
                          sortsItem.find((item) => item.value === sortValue)
                            .label
                        }
                      </div>
                    ) : (
                      'Sort by...'
                    )
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sortsItem.map((item) => (
                    <SelectItem value={item.value} key={item.value}>
                      <div className='flex items-center gap-2'>
                        <item.icon className='h-4 w-4 text-white' />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <MultipleSelect
              name={'rarity'}
              list={raritysItem}
              value={rarityValue}
              setValue={setRarityValue}
              onChange={(_) => {
                setSearchParams({
                  ...searchParamValues,
                  'detail.rarity': _
                })
              }}
            />

            <MultipleSelect
              name={'type'}
              list={typesItem}
              value={typeValue}
              setValue={setTypeValue}
              onChange={(_) => {
                setSearchParams({
                  ...searchParamValues,
                  'detail.type': _
                })
              }}
            />
          </div>
        </div>
        <div className=''>
          <ListItemInStore
            data={data}
            loading={loading}
            getItems={getDataWhenScrollDown}
          />
        </div>
      </section>
    </div>
  )
}

export default Home

const MultipleSelect = ({ list, value, setValue, name = 'item', onChange }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          className='w-max min-w-[120px] justify-between'
        >
          {value?.length ? (
            `${value?.length} ${name} selected`
          ) : (
            <p className='first-letter:uppercase'>{name}</p>
          )}
          <ChevronDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-max min-w-[120px] p-0'
        side='bottom'
        align='end'
      >
        <Command>
          <CommandInput placeholder={`Search ${name}...`} className='h-9' />
          <CommandEmpty>No {name} found.</CommandEmpty>
          <CommandGroup>
            {list?.map((item) => (
              <CommandItem
                key={item.value}
                onSelect={() => {
                  let newValue
                  if (!value.includes(item.value)) {
                    newValue = [...value, item.value]
                  } else {
                    newValue = value.filter((_) => _ !== item.value)
                  }
                  setValue(newValue)
                  onChange(newValue)
                }}
              >
                {item.label}
                <CheckIcon
                  className={cn(
                    'ml-auto h-4 w-4 text-white',
                    value.includes(item?.value) ? 'opacity-100' : 'opacity-0'
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
