import JSEncrypt from 'jsencrypt'

class RsaEncrypt {
  private publicKey: string | null = null
  private encrypt: JSEncrypt | null = null

  constructor() {
    this.publicKey = null
    this.encrypt = null
  }

  /**
   * Set Public Key
   */
  setPublicKey(publicKey: string) {
    this.publicKey = publicKey
    this.encrypt = new JSEncrypt()
    this.encrypt.setPublicKey(publicKey)
  }

  /**
   * Encrypt Data
   */
  encryptData(data: string): string | false {
    if (!this.encrypt) {
      throw new Error('Public key not set')
    }
    return this.encrypt.encrypt(data)
  }

  /**
   * Encrypt Password
   */
  encryptPassword(password: string): string | false {
    return this.encryptData(password)
  }

  /**
   * Check if public key is set
   */
  hasPublicKey(): boolean {
    return !!this.publicKey
  }
}

const rsaEncrypt = new RsaEncrypt()

export default rsaEncrypt
