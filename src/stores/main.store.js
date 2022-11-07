import { makeAutoObservable, runInAction } from "mobx"
import axios from "axios"
import web3Utils from "web3-utils"

const {fromWei, toBN} = web3Utils

const getToday = ()=> {
  const dateObj = new Date();
  const month = dateObj.getUTCMonth() + 1; //months from 1-12
  const day = dateObj.getUTCDate();
  const year = dateObj.getUTCFullYear();
  return `${year}-${month < 10 ? '0'+month : month}-${day < 10 ? '0' + day : day}`
}

class MainStore {

  headDirectory = 'bad-debt'
  tableData = []
  tableRowDetails = null
  loading = true
  blackMode =  null
  badDebtCache = {}
  badDebtSubJobsCache = {}
  today = getToday()
  oldestDay = '2022-10-24'
  selectedDate = getToday()
  initializationPromise = null

  constructor () {
    makeAutoObservable(this)
    this.initializationPromise = this.init()
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // dark mode
      this.blackMode = true
    }
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      this.blackMode = !!e.matches
    });
  }

  get githubDirName () {
    const [year, month, day] = this.selectedDate.split('-')
    
    if(this.selectedDate === this.today) {
      return 'latest'
    }
    
    // remove 0 from day and month as there is no starting 0 in the github directories
    // example: 2022-11-04 => 4.11.2022
    return `${day.replace(/^0/, '')}.${month.replace(/^0/, '')}.${year}`
  }

  setSelectedDate = (e) => {
    this.selectedDate = e.target.value
    this.initializationPromise = this.init()
  }

  setBlackMode = (mode) => {
    this.blackMode = mode
  }

  getJsonFile = async fileName => {
    const { data: file } = await axios.get(`https://raw.githubusercontent.com/Risk-DAO/simulation-results/main/${this.headDirectory}/${this.githubDirName}/${encodeURIComponent(fileName)}`)
    if(!file) return
    if(fileName.indexOf('subjob') === -1){
      this.badDebtCache[fileName.replace('.json', '')] = file
    } else {
      const key = fileName.replace('.json', '').replace('subjob', '')
      const platform = key.split('_')[1]
      const platformSubJobs = this.badDebtSubJobsCache[platform] = this.badDebtSubJobsCache[platform] || {}
      platformSubJobs[key] = file
    }
  }

  getFileNames = async () => {
    // clear the cache when changing day
    this.badDebtCache = {};
    this.badDebtSubJobsCache = {};
    const dirToGet = this.headDirectory + '/' + this.githubDirName + '/';
    console.log('dirToGet', dirToGet)
    const allDirs = await axios.get('https://api.github.com/repos/Risk-DAO/simulation-results/git/trees/main?recursive=1');
    // console.log('allDirs', allDirs);
    const selectedFiles = allDirs.data.tree.filter(_ => _.path.startsWith(dirToGet))
    // console.log('selectedFiles', selectedFiles)
    return selectedFiles.map(_ => _.path.split('/').slice(-1)[0]);
  }

  badDebtFetcher = async () => {
    try{
      const fileNames = await this.getFileNames()
      const filePromises = fileNames.map(this.getJsonFile)
      await Promise.all(filePromises)
      console.log('badDebtCache done')
    } catch (err) {
      console.error(err)
    }
  }

  init = async () => {
    runInAction(()=> this.loading = true)
    await this.badDebtFetcher()
    const subJobs = this.badDebtSubJobsCache
    const subJobSummeries = Object.entries(subJobs).map(this.summarizeSubJobs)
    const badDebt = this.badDebtCache
    
    const rows = Object.entries(badDebt).map(([k, v])=> {
      const [chain, platform, market] = k.split('_')
      let {total, updated, users, decimals, tvl} = v
      const totalDebt = Math.abs(normalize(total, decimals))
      tvl = Math.abs(normalize(tvl, decimals));
      console.log(chain, platform, totalDebt, tvl);
      return {
        platform,
        chain,
        tvl,
        total: totalDebt,
        ratio: 100 * (totalDebt/tvl),
        updated,
        users,
      }
    })
    
    runInAction(() => {
      this.tableData = rows.concat(subJobSummeries)
      this.loading = false
    })
    
    this.sortBy("tvl")
  }

  sortBy(sortAttribute){
    this.tableData = this.tableData.slice().sort((a, b) => {
      return Number(b[sortAttribute]) - Number(a[sortAttribute])
    })
  }

  openTableRowDetails = (name)=> {
    if(this.tableRowDetails === name){
      this.tableRowDetails = null
      return
    }
    this.tableRowDetails = name
  }

  summarizeSubJobs = ([platform, markets]) => {
    const chain = [...new Set(Object.keys(markets).map(market => market.split('_')[0]))].join(',')
    let tvl = (Object.values(markets).reduce((acc, market) => toBN(acc).add(toBN(market.tvl)), '0')).toString()
    let total = (Object.values(markets).reduce((acc, market) => toBN(acc).add(toBN(market.total)), '0')).toString()
    let {decimals} = Object.values(markets)[0]
    const totalDebt = Math.abs(normalize(total, decimals));
    tvl = Math.abs(normalize(tvl, decimals))
    let updated = Object.values(markets).map(({updated})=> updated).sort((a, b)=> Number(a) - Number(b))[0]
    let users = [].concat(...Object.values(markets).map(({users}) => users))

    return {
      platform,
      chain,
      tvl,
      total: totalDebt,
      ratio: 100 * (totalDebt/tvl),
      updated,
      users,
      markets
    }
  }
}

function normalize(amount, decimals) {
  if(decimals === 18) {
      return  Number(fromWei(amount))
  }
  else if(decimals > 18) {
    const factor = toBN("10").pow(toBN(decimals - 18))
    const norm = toBN(amount.toString()).div(factor)
    return Number(fromWei(norm))
  } else {
      const factor = toBN("10").pow(toBN(18 - decimals))
      const norm = toBN(amount.toString()).mul(factor)
      return Number(fromWei(norm))
  }
}

export default new MainStore()
