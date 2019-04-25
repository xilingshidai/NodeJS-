const key = require('./key')
const superagent1 = require('superagent');
const superagent=require('superagent-charset')(superagent1)
const cheerio = require('cheerio');
const async = require('async');
const fs = require('fs');
// const url = require('url');
// const request =require('request');
// const hupuUrl = 'https://bbs.hupu.com/selfie-1';
// const iconv = require('iconv-lite')
let ssr = [];
let allUrl = [];
let curCount = 0;  
let number = 0
let name = '套装书'
let sort = key.JD.套装书
let pageNumber = 0
let urlNumber = 0
getpage()
function getpage() {
  let url = 'https://list.jd.com/list.html?cat='+sort+'&page=1&delivery=1&stock=0&sort=sort_winsdate_desc&trans=1&JL=4_6_0#J_main'
  superagent.get(url).end(function (err, res) {
    if (err) {
      return console.error(err);1
    }
    let $ = cheerio.load(res.text);
    //获取此分类总页数

    pageNumber = parseInt($('.fp-text>i').text())
    console.log(name + '共'+pageNumber+'页')
    // for循环把页面循环出来
    for (let i = 1; i <=pageNumber; i++) {
      setTimeout(function(){
        pachong(i)
        console.log(i+'   33333')
      },i*1000)
    }
  })
}



function pachong (i){
  let url = 'https://list.jd.com/list.html?cat='+sort+'&page=' + i + '&delivery=1&stock=0&sort=sort_winsdate_desc&trans=1&JL=4_6_0#J_main'
  console.log(url)
  //通过superagent去请求每一页
  superagent.get(url).end(function (err, res) {
    if (err) {
      return console.error(err);
    }
    //cheerio  nodejs版的JQ 
    let $ = cheerio.load(res.text);
    //获取本页图书的链接
    $('.gl-item>div>.p-img>a').each(function (idx, element) {
      let $element = $(element);
      let href = 'https:'+$element.attr('href');
      if(href.indexOf('dist=jd') === -1) {
        console.log(i+'页'+'第'+curCount+'个链接出错........')
        console.log(href)
        console.log(url)
      }
      allUrl.push(href);
      curCount++;
      console.log('第'+curCount+'个链接')
    });
    urlNumber++
    // 当循环的页数等于分类页数时，证明已取得所有图书链接，开始爬取图书信息
    if(urlNumber === pageNumber) {
      async.mapLimit(allUrl,30,function(bookUrl,callback){
        getBookInfo(bookUrl,callback);
      },function(err,result){
        if(err){
          console.log(err);
        }else{
          console.log("全部已下载完毕！");
        }
      })
    }
    console.log('第'+i+'页')
  });
}
// 爬取单本图书信息
function getBookInfo (href,callback) {
  superagent.get(href).charset().buffer(true).timeout(2400000).end(function (err, res) {
    if(err){
        return console.error(err + href);
    }
    let $ = cheerio.load(res.text);
    let add = href;
    let title = $('#spec-n1>img').attr('alt');//书名
    let image = 'https:' + $('#spec-n1>img').attr('src');//图书图片
    //let author = $('#p-author>a').attr('data-name');//作者
    let author = []
    let zuozhe = $('#p-author').text().trim()
    author.push(zuozhe)
    let text = $('#parameter2').text().trim()
    // let text = text1.replace(/^\s+|\s+$/g,"")
    let ISBN
    if (text.indexOf('ISBN：') !== -1) {
      ISBN = text.split('ISBN：')[1].split('\n')[0]
    }
    let publisher = text.split('ISBN：')[0].replace(/\s+/g,"").split('出版社：')[1]
    let pubdate
    if (text.indexOf('出版时间：') !== -1) {
      pubdate = text.split('出版时间：')[1].split('\n')[0]
    }
    let pages = 0
    if (text.indexOf('页数：') !== -1) {
        pages = text.split('页数：')[1].split('\n')[0]
    }
    let id = href.split('jd.com/')[1].split('.')[0]
    // 内容简介作者简介等信息是单独加载，所以要单独获取
    let summaryURL = 'https://dx.3.cn/desc/'+ id + '?cdn=2&callback=showdesc'
    superagent.get(summaryURL).charset().buffer(true).end(function (err, res) {
      if(err){
        return console.error(err + summaryURL);
      }
      let jianjie = res.text.replace(/[\r\n]/g,"").replace(/[\\n]/g,'')
      let $ = cheerio.load(jianjie);
      let summary = $('#detail-tag-id-3>div:nth-child(2)>div').text()
      let author_intro = $('#detail-tag-id-3>div:nth-child(2)>div').text()
      //把数据存储到一个对象里
      let stad = {
        number: number,
        "address": add,
        "title":title,
        "author" : author,
        "image" : image,
        ISBN: ISBN,
        publisher: publisher,
        pubdate: pubdate,
        pages: pages,
        summary: summary,
        category: name,
        author_intro: author_intro
      };
      //通过fs模块把数据写入本地json
      fs.appendFile('data2/' + name + '.json', JSON.stringify(stad) ,'utf-8', function (err) {
          if(err) throw new Error("appendFile failed...");
          //console.log("数据写入success...");
      });
      number += 1
      console.log(number)
      callback(null,"successful !");
    })
    
  })
}
console.log('开始')