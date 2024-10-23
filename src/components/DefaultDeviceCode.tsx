import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { IDeviceLoginState } from '../AuthWrapper';
import { FadeLoader } from 'react-spinners';
import logo from '../assets/img/logo-ost.webp';

function Loader() {
  return <FadeLoader />;
}

function QRLoader({ size }: { size: number }) {
  const height = Math.min(size / 10, 25);
  const width = Math.min(size / 30, 5);
  const radius = Math.min(height, width) / 2;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <FadeLoader height={height} width={width} radius={radius} />
    </div>
  );
}

export function DefaultDeviceCode(props: IDeviceLoginState) {
  const { error, loading, data } = props;
  const qrCode = data?.verification_uri_complete;
  const code = data?.user_code;
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    if (data?.exp) {
      const timer = setInterval(
        () =>
          setSeconds(Math.max(Math.round((data.exp - Date.now()) / 1000), 0)),
        1000,
      );
      return () => clearInterval(timer);
    } else {
      setSeconds(0);
    }
  }, [data]);

  const ref = useRef<HTMLDivElement>(null);
  const size = (ref.current?.offsetWidth || 300) - 20;
  const isFromLoader =
    new URLSearchParams(window.location.search).get('loader') === 'true';
  const enablePopup =
    new URLSearchParams(window.location.search).get('popup') === 'true';

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2vw',
        backgroundColor: '#f8ca08',
      }}
    >
      <img
        src={logo}
        alt="logo"
        style={{ width: '25%', maxWidth: '150px', marginTop: '2rem' }}
      />
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: '1rem',
          margin: 'auto',
          boxShadow: '1px 1px 10px 1px lightgrey',
        }}
      >
        <h3 style={{ fontWeight: 'bold', fontSize: 'max(2vw, 2vh)' }}>
          Please authorize this device
        </h3>
        {(isFromLoader || error?.kind === 'INVALID_MODULE') && (
          <button
            style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              fontSize: 'medium',
              fontWeight: 'bold',
              borderRadius: '0.5rem',
              backgroundColor: '#f8ca08',
              boxShadow: '1px 1px 10px 1px lightgrey',
            }}
            onClick={() =>
              window.location.replace(
                'https://module-loader.orderingstack.com/?reset=true',
              )
            }
          >
            Change module
          </button>
        )}
        <div
          style={{
            width: '100%',
            height: '1px',
            display: 'flex',
            backgroundColor: 'lightgray',
          }}
        />
        {code && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <h4
              style={{
                fontSize: '1.25rem',
                marginRight: '0.5rem',
              }}
            >
              CODE
            </h4>
            <span
              style={{
                textTransform: 'uppercase',
                fontSize: '2.25rem',
                fontWeight: 'bold',
              }}
            >
              {loading ? 'Loading...' : code}
            </span>
          </div>
        )}
        {code && (
          <h4 style={{ fontSize: 'max(1.5vw, 1.5vh)' }}>
            Code validity {seconds}s
          </h4>
        )}
        {qrCode && !loading && (
          <button
            disabled={!enablePopup}
            onClick={() =>
              window.open(qrCode, '_blank', 'popup,width=450,height=500')
            }
            style={{
              backgroundColor: 'white',
              border: 'unset',
              cursor: 'pointer',
              borderRadius: 'min(2vw, 2vh)',
            }}
          >
            <QRCodeSVG value={qrCode} size={size} level="H" />
          </button>
        )}
        {loading && <QRLoader size={size} />}
        {error?.message && (
          <h1 style={{ color: 'red' }}>Error: {error.message}</h1>
        )}
      </div>
    </div>
  );
}
