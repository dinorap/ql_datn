import { BannerSlider, Banner, Category } from "../../components/Header&Footer/HeaderFooter";
import { Outlet } from "react-router-dom";

const SharedLayout = () => {

    return (
        <div style={{ backgroundColor: '#f4f6f8' }}>
            <div style={{ maxWidth: '1350px', margin: '15px auto 0', display: 'flex', gap: '15px', padding: '0 10px' }}>
                <div style={{ width: '290px', flexShrink: 0, background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden', height: 'fit-content' }}>
                    <Category />
                </div>
                <div style={{ flex: 1, minWidth: 0, borderRadius: '10px', overflow: 'hidden' }}>
                    <BannerSlider />
                </div>
            </div>
            <div style={{ maxWidth: '1350px', margin: '15px auto', padding: '0 10px' }}>
                <Banner />
            </div>
            <Outlet />
        </div>
    );
};

export default SharedLayout;

