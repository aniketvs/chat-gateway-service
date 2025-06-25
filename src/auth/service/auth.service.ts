
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AuthService {
  async validateUser(token: string): Promise<any> {
    if (!token) return null;
    try {
        console.log("respinse");
      const response = await axios.get(
        'http://auth-service:5005/api/auth/verify-token',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log("respinse",response.data);
      if (response.data.status == 'failed') {
        console.error('Token verification failed:', response.data.message);
        return null;
      }
      return response.data.user;
    } catch (error) {
      console.error('Token verification failed:', error.message);
      return null;
    }
  }
}
