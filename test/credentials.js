/**
 * Created by schwarzkopfb on 23/05/16.
 */

const {
          DEV_REDIS_HOST: host,
          DEV_REDIS_PORT: port,
          DEV_REDIS_PASSWORD: password,
          DEV_REDIS_VICTORIA: db
      } = process.env

module.exports = {
    host,
    port,
    password,
    db,
    url: `redis://${host}:${port}/${db}?password=${encodeURIComponent(password)}`
}
