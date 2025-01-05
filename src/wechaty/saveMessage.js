import fs from 'fs'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 用来存储聊天记录的数组
let chatHistory = []

// 获取当前日期，格式化为 YYYY-MM-DD
function getCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 生成聊天记录文件的路径，基于当前日期
function getChatHistoryFilePath() {
  const currentDate = getCurrentDate()
  return path.join(__dirname, 'chatHistory', `chatHistory-${currentDate}.json`)
}

// 创建聊天记录目录（如果不存在）
function createChatHistoryDir() {
  const dirPath = path.join(__dirname, 'chatHistory')
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}
// 获取当前日期，格式化为 yyyy-MM-dd HH:mm:ss
function formatDate(timestamp) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export async function saveMessage(msg, bot) {
  // 读取消息类型和内容
  const chatData = {
    sender: msg.talker().name(),
    content: msg.text(),
    type: msg.type(),
    timestamp: Date.now(),
    time: formatDate(Date.now()), // 格式化时间
  }
  if (msg.type() === bot.Message.Type.Image) {
    const img = await msg.toFileBox() // 获取图片文件
    const filePath = path.join(__dirname, 'media', 'images', `${Date.now()}.jpg`) // 生成保存路径

    // 确保保存文件的文件夹存在
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true })
    }

    // 保存图片
    await img.toFile(filePath)
    console.log(`图片已保存到：${filePath}`)
    chatData.content = '图片已保存' // 可以设置内容为提示文本
    chatData.filePath = filePath // 保存图片的路径
  } else if (msg.type() === bot.Message.Type.Video) {
    // 视频消息
    const video = await msg.toFileBox() // 获取视频文件
    const videoPath = path.join(__dirname, 'media', 'videos', `${Date.now()}.mp4`) // 生成保存路径

    // 确保保存文件的文件夹存在
    if (!fs.existsSync(path.dirname(videoPath))) {
      fs.mkdirSync(path.dirname(videoPath), { recursive: true })
    }

    // 保存视频
    await video.toFile(videoPath)
    console.log(`视频已保存到：${videoPath}`)

    // 将视频的路径保存到 chatData 中
    chatData.content = '视频已保存' // 可以设置内容为提示文本
    chatData.filePath = videoPath // 保存视频的路径
  }
  console.log('接收到消息:', chatData)
  // 将消息保存到聊天记录数组
  chatHistory.push(chatData)
  // 如果需要，可以定期保存聊天记录
  if (chatHistory.length >= 6) {
    // 假设每次保存6条消息
    createChatHistoryDir()
    const historyPath = getChatHistoryFilePath()
    if (!fs.existsSync(path.dirname(historyPath))) {
      fs.writeFileSync(historyPath, JSON.stringify(chatHistory, null, 2))
      console.log(`聊天记录文件已创建并已保存到：${historyPath}`)
    } else {
      fs.appendFileSync(historyPath, JSON.stringify(chatHistory, null, 2) + '\n') // 每次写入后添加换行符
      console.log(`聊天记录已追加到：${historyPath}`)
    }
    chatHistory = []
  }
}
