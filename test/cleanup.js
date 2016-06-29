/**
 * Created by schwarzkopfb on 29/06/16.
 */

'use strict'

const arg = process.argv[ 2 ]

if (arg !== '-i' && arg !== '--interactive')
    require('tap').pass('done')
else {
    const readline = require('readline'),
          colors   = require('colors'),
          redis    = require('redis'),
          cred     = require('./credentials'),
          rl       = readline.createInterface({ input: process.stdin, output: process.stdout })

    rl.on('SIGINT', () => {
        console.log('\n^C')
        rl.close()
    })

    console.log(
        `Database: ${cred.safeUrl.blue}\n\n` +
        `This script will perform a ${'FLUSHDB'.red} command on that database,\n` +
        `which causes ${'irreversible data loss'.red}.\n`
    )

    rl.question(
        'Are you sure you want to continue? (y/n) ',

        answer => {
            if (answer.match(/^y(es)?$/i)) {
                const client = redis.createClient(cred.url)

                // WARNING: this drops all the data in the selected database!
                client.flushdb(err => {
                    if (err) {
                        console.error(err.stack)

                        rl.close()
                        client.unref()
                        process.exit(1)
                    }
                    else {
                        console.log('\nCleanup completed'.yellow)

                        rl.close()
                        client.quit()
                    }
                })
            }
            else {
                rl.close()
                console.log('\nAborted'.yellow)
            }
        }
    )
}
