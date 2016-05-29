/**
 * Created by schwarzkopfb on 23/05/16.
 */

const {
          DEV_REDIS_HOST: host,
          DEV_REDIS_PORT: port,
          DEV_REDIS_PASSWORD: password,
          DEV_REDIS_VICTORIA: num
      } = process.env

module.exports = `redis://${host}:${port}/${num}?password=${encodeURIComponent(password)}`
