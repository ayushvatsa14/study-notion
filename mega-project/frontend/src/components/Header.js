import {NavLink} from 'react-router-dom';
import Logo from '../assets/Logo/Logo-Full-Light.png';

const Header=() => {
    return (
        <div className='bg-[#161D29]'>
            <img src={Logo} alt='Logo'/>

            <div>
                <NavLink to='/'>Home</NavLink>
                <p>Catalog</p>
                <NavLink to='/contact'>Contact Us</NavLink>
            </div>
        </div>
    );
}

export default Header;