import { Context, Schema } from 'koishi';
import { } from 'koishi-plugin-adapter-iirose';

export const name = 'iirose-subscribe';

export interface Config { }

export const inject = ['database'];

export const Config: Schema<Config> = Schema.object({});

declare module 'koishi' {
  interface Tables
  {
    iirose_subscribe: subscribe;
  }
}

export interface subscribe
{
  uid: string;
  status: boolean;
}

const usage = `# 快速说明
1. 在群内发送iirose.sub.on，将会订阅BOT的消息
2. 在群内发送iirose.sub.off，将会取消订阅BOT的消息
3. 订阅状态会在数据库中保存，不会因为重启而消失
4. 本插件只会在iirose中生效

# 注意事项
开启订阅状态后，私聊bot发送内容，会被转发到群内
开启订阅状态后，群内发送内容，会被转发到私聊bot
关闭订阅状态后，不会再转发消息
`

export function apply(ctx: Context)
{
  ctx.model.extend('iirose_subscribe', {
    uid: 'string',
    status: 'boolean'
  }, {
    primary: 'uid'
  });

  ctx.command('iirose', '花园工具');

  ctx.command("iirose.sub", '订阅房间').subcommand('.on', '开启订阅').action(async (v, message) =>
  {
    if (v.session.platform !== 'iirose') { return ' [IIROSE-Subscribe] 该平台不支持使用此插件'; }
    const userData = await ctx.database.get('iirose_subscribe', v.session.userId);

    if (userData.length > 0 && userData[0].status)
    {
      return ' [IIROSE-Subscribe] 你已经设置为订阅状态了哦~';
    } else if (userData.length > 0)
    {
      await ctx.database.set('iirose_subscribe', v.session.userId, {
        status: true
      });

      return ` [IIROSE-Subscribe] 将 [*${v.session.username}*] 设置为BOT订阅状态`;
    } else if (userData.length == 0)
    {
      ctx.database.create('iirose_subscribe', {
        uid: v.session.userId,
        status: true
      });

      return ` [IIROSE-Subscribe] 将 [*${v.session.username}*] 设置为BOT订阅状态`;
    }
  });

  ctx.command("iirose.sub", '订阅房间').subcommand('.off', '关闭订阅').action(async (v, message) =>
  {
    if (v.session.platform !== 'iirose') { return ' [IIROSE-Subscribe] 该平台不支持使用此插件'; }
    const userData = await ctx.database.get('iirose_subscribe', v.session.userId);

    if (userData.length > 0 && userData[0].status)
    {
      return ' [IIROSE-Subscribe] 你已经设置为订阅状态了哦~';
    } else if (userData.length > 0)
    {
      await ctx.database.set('iirose_subscribe', v.session.userId, {
        status: false
      });

      return ` [IIROSE-Subscribe] 将 [*${v.session.username}*] 设置为BOT订阅状态`;
    } else if (userData.length == 0)
    {
      ctx.database.create('iirose_subscribe', {
        uid: v.session.userId,
        status: false
      });

      return ` [IIROSE-Subscribe] 将 [*${v.session.username}*] 设置为BOT订阅状态`;
    }
  });
  
  ctx.on('message', async (session) =>
  {
    if (session.platform !== 'iirose') { return; }

    const userData = await ctx.database.get('iirose_subscribe', session.userId);

    if (userData.length <= 0 || !userData[0].status) return;

    const msg = session.content;
    const channelId = session.channelId;

    if (channelId.startsWith('public'))
    {
      const listTemp = await ctx.database.get('iirose_subscribe', { status: true });
      // const list = listTemp.filter(v => { if (v.uid !== session.userId) return true; else return false; }).map(v => v.uid);
      const list = listTemp.map(v => v.uid);
      list.forEach(v =>
      {
        session.bot.sendMessage(`private:${v}`, ` [*${session.username}*] ： ${msg}`);
      });
    } else if (channelId.startsWith('private'))
    {
      session.bot.sendMessage('public', ` [*${session.username}*] ： ${msg}`);
      const listTemp = await ctx.database.get('iirose_subscribe', { status: true });
      // const list = listTemp.filter(v => { if (v.uid !== session.userId) return true; else return false; }).map(v => v.uid);
      const list = listTemp.map(v => v.uid);
      list.forEach(v =>
      {
        session.bot.sendMessage(`private:${v}`, ` [*${session.username}*] ： ${msg}`);
      });
    }
  });
}
