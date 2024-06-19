import React, { useContext } from 'react';
import AuthContext from './AuthContext';

export default function SignOut(props: any) {
  const { signOut } = useContext(AuthContext);
  return <button onClick={() => signOut?.()}>Logout</button>;
}
