import React from 'react';
import ReactDOM from 'react-dom'
import NotificationSystem from 'react-notification-system';

export default {
    instance(){
        var style = {
            Containers: {
                DefaultStyle: {
                    zIndex: 99999,
                },
            },
            // NotificationItem: { // Override the notification item
            //     DefaultStyle: { // Applied to every notification, regardless of the notification level
            //         // margin: '10px 5px 2px 1px'
            //         zIndex: 99999
            //     },
            //
            //     // success: { // Applied only to the success notification item
            //     //     color: 'red'
            //     // }
            // }
            NotificationItem: {
                error: {
                    borderTop: 'none',
                    borderLeft: '2px solid rgb(236, 61, 61)'
                },
                success: {
                    borderTop: 'none',
                    borderLeft: '2px solid rgb(94, 164, 0)'
                }
            }
        };
        ReactDOM.render(
            <NotificationSystem ref={this.panelRef.bind(this)} style={style} />,
            document.getElementById('notification')
        );
    },
    panelRef(c){
        this._notificationSystem = c;
    },
    // tr (top right), tl (top left), tc (top center), br (bottom right), bl (bottom left), bc (bottom center)
    success(message, position='br'){
        this._addNotification(message, '', 'success', position);
    },
    error(message, position='br'){
        this._addNotification(message, '', 'error', position);
    },
    warning(message, position='br'){
        this._addNotification(message, '', 'warning', position);
    },
    info(message, position='br'){
        this._addNotification(message, '', 'info', position);
    },
    _addNotification(message, title='', level, position='br'){
        if (this._notificationSystem){
            this._notificationSystem.addNotification({
                message,
                level,
                title,
                position
            });
        }
    },
    clear(){
        if (this._notificationSystem){
            this._notificationSystem.clearNotifications();
        }
    }
};
